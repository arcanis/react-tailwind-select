import {InfiniteData, keepPreviousData, QueryKey, UseInfiniteQueryOptions, UseQueryOptions} from '@tanstack/react-query';
import {ast, parse}                                                                         from 'react-tailwind-select/sources/search/grammar';
import {useEffect, useState}                                                                from 'react';
import initSqlJs, {QueryExecResult}                                                         from 'sql.js';

const promise = Promise.resolve().then(async () => {
  const SQL = await initSqlJs({
    locateFile: file => `/sql.js/dist/${file}`,
  });

  const dbReq = await fetch(`/demo.db`);
  const dbData = await dbReq.arrayBuffer();

  return new SQL.Database(new Uint8Array(dbData));
});

async function evaluate(query: string, params: Record<string, any> = {}) {
  const db = await promise;
  console.log(`Evaluating`, query, params);

  let result: QueryExecResult | undefined;
  try {
    result = db.exec(query, params)[0];
  } catch (err) {
    console.error(err);
    throw err;
  }

  if (typeof result === `undefined`)
    return [];

  const {columns, values} = result;

  return values.map(row => {
    return Object.fromEntries(row.map((value, index) => {
      return [columns[index], value];
    }));
  });
}

export function sql<T = any>(query: string, params: Record<string, any> = {}) {
  return {
    queryKey: [`sql`, query, params],
    queryFn: async (): Promise<Array<T>> => {
      return (await evaluate(query, params)) as Array<T>;
    },
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  } satisfies UseQueryOptions<Array<T>, Error, Array<T>, QueryKey>;
}

export type Page<T> = {
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  itemCount: number;
  data: Array<T>;
};

export function paginatedSql<T = any>(query: string, params: Record<string, any> = {}): UseInfiniteQueryOptions<Page<T>, Error, InfiniteData<Page<T>, number>, Page<T>, QueryKey, number> {
  const pageSize = 10;

  return {
    queryKey: [`paginatedSql`, query],
    initialPageParam: 1,
    queryFn: async ({pageParam}) => {
      const [{count}] = await evaluate(/*sql*/ `SELECT COUNT(*) AS count FROM (${query})`, params) as [{count: number}];
      const data = await evaluate(`${query} LIMIT $offset, $limit`, {...params, $offset: (pageParam - 1) * pageSize, $limit: pageSize});

      return {
        pageIndex: pageParam,
        pageSize,
        pageCount: Math.ceil(count / pageSize),
        itemCount: count,
        data: data as any,
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage ? allPages.length : undefined;
    },
    getPreviousPageParam: (firstPage, allPages) => {
      return undefined;
    },
    staleTime: Infinity,
  };
}

export enum FieldType {
  String,
  Number,
  JsonArray,
}

export type FieldConfig = {
  [K in ast.Operator]?: string;
};

export type SqlSearchConfig = {
  default: string;
  fields: Record<string, FieldConfig>;
};

export function searchToSql(search: string, config: SqlSearchConfig): [string, Array<any>] {
  const ast = parse(search);
  const args: Array<any> = [];

  function visit(ast: ast.Expression): string {
    switch (ast.type) {
      case `default`: {
        return visit({type: `filter`, field: config.default, operator: `=`, value: ast.value});
      } break;

      case `filter`: {
        const fieldConfig = config.fields[ast.field];
        if (!Object.hasOwn(config.fields, ast.field))
          throw new Error(`Unknown field: ${ast.field}`);

        const operatorGen = fieldConfig[ast.operator];
        if (typeof operatorGen === `undefined`)
          throw new Error(`Unknown operator ${ast.operator} for field ${ast.field}`);

        const varCount = operatorGen.match(/\?/g)?.length ?? 0;
        for (let t = 0; t < varCount ?? 0; t++)
          args.push(ast.value);

        return operatorGen;
      } break;

      case `and`: {
        return `(${visit(ast.left)} AND ${visit(ast.right)})`;
      } break;

      case `or`: {
        return `(${visit(ast.left)} OR ${visit(ast.right)})`;
      } break;

      default: {
        const exhaustiveCheck: never = ast;
        return exhaustiveCheck;
      } break;
    }
  }

  const where = ast ? visit(ast) : `1`;
  return [where, args];
}

function mergeOperators(fields: Array<FieldConfig>, op: ast.Operator) {
  const filtered = fields
    .map(field => field[op])
    .filter(Boolean);

  if (filtered.length === 0)
    return undefined;

  return `(${filtered.join(` OR `)})`;
}

export const operators = {
  string: (fieldName: string) => ({
    [`=`]: `(INSTR(LOWER(${fieldName}), LOWER(?)) > 0)`,
  }),

  stringArray: (fieldName: string): {[`=`]: string} => ({
    [`=`]: `EXISTS (SELECT 1 FROM json_each(${fieldName}) WHERE ${operators.string(`json_each.value`)[`=`]})`,
  }),

  number: (fieldName: string) => ({
    [`=`]: `(${fieldName} = ?)`,
    [`<`]: `(${fieldName} < ?)`,
    [`>`]: `(${fieldName} > ?)`,
    [`<=`]: `(${fieldName} <= ?)`,
    [`>=`]: `(${fieldName} >= ?)`,
  }),

  merge: (fields: Array<FieldConfig>) => ({
    [`=`]: mergeOperators(fields, `=`),
    [`<`]: mergeOperators(fields, `<`),
    [`>`]: mergeOperators(fields, `>`),
    [`<=`]: mergeOperators(fields, `<=`),
    [`>=`]: mergeOperators(fields, `>=`),
  }),
} satisfies Record<string, (...args: Array<any>) => FieldConfig>;

export function useSearch(search: string, config: SqlSearchConfig): ReturnType<typeof searchToSql> {
  const [searchParams, setSearchParams] = useState<string>(`["1",[]]`);

  let newSearchParams: ReturnType<typeof searchToSql> | undefined;
  try {
    newSearchParams = searchToSql(search, config);
  } catch {}

  const stringified = JSON.stringify(newSearchParams);

  useEffect(() => {
    if (typeof stringified !== `undefined`) {
      setSearchParams(stringified);
    }
  }, [searchParams, stringified]);

  return JSON.parse(searchParams);
}
