import 'react-tailwind-select/styles/core.css';
import 'react-tailwind-select/styles/select.css';
import type {Meta, StoryObj}                                             from '@storybook/react';
import {useInfiniteQuery, useQuery}                                      from '@tanstack/react-query';
import {Select}                                                          from 'react-tailwind-select';
import {useState}                                                        from 'react';

import {FieldType, operators, paginatedSql, searchToSql, sql, useSearch} from '../.storybook/sql';

const meta: Meta<typeof Select> = {
  component: Select,
};

// eslint-disable-next-line arca/no-default-export
export default meta;

const simpleOptions = [{
  label: `Option 1`,
  value: `option-1`,
}, {
  label: `Option 2`,
  value: `option-2`,
}, {
  label: `Option 3`,
  value: `option-3`,
}];

export const Simple: StoryObj = {
  args: {
    className: `classic`,
    placeholder: `Click to select a value...`,
  },
  render: props => {
    const [value, setValue] = useState<string | undefined>();
    return <Select {...props} options={simpleOptions} value={value} onChange={setValue}/>;
  },
};

export const Query: StoryObj = {
  args: {
    className: `classic`,
    placeholder: `Click to select a value...`,
  },
  render: props => {
    const query = useQuery(sql<{
      id: string;
      name: string;
    }>(/*sql*/ `
      SELECT id, name FROM cards ORDER BY name
    `));

    const options = query.data?.map(card => ({
      label: card.name as string,
      value: card.id as string,
    })) ?? [];

    const [value, setValue] = useState<string | undefined>();
    return <Select {...props} options={options} value={value} onChange={setValue}/>;
  },
};

export const Infinite: StoryObj = {
  args: {
    className: `classic`,
    placeholder: `Click to select a value...`,
  },
  render: props => {
    const query = useInfiniteQuery(paginatedSql<{
      id: string;
      name: string;
    }>(/*sql*/ `
      SELECT id, name FROM cards ORDER BY name
    `));

    const options = query.data?.pages.flatMap(page => page.data.map(card => ({
      label: card.name,
      value: card.id,
    }))) ?? [];

    const [value, setValue] = useState<string | undefined>();
    return <Select {...props} options={options} value={value} onChange={setValue} fetchNextPage={query.hasNextPage && query.fetchNextPage}/>;
  },
};

function withDelay<TParams extends {signal: AbortSignal}, T extends {queryFn: (params: TParams) => Promise<any>}>(query: T, delay: number): T {
  return {
    ...query,
    queryFn: async params => {
      await new Promise(resolve => setTimeout(resolve, delay));

      if (params.signal.aborted)
        throw new Error(`Aborted`);

      return query.queryFn(params);
    },
  };
}

function LazyCard({filter, pageSize, index}: {filter: string, pageSize: number, index: number}) {
  const pageIndex = Math.floor(index / pageSize);
  const indexInPage = index % pageSize;

  const {isLoading, data} = useQuery(withDelay(sql<{
    name: string;
  }>(/*sql*/ `
    ${filter} LIMIT $pageOffset, $pageSize
  `, {
    $pageOffset: pageIndex * pageSize,
    $pageSize: pageSize,
  }), 100));

  return <>
    {isLoading && <div className={`animate-pulse h-2 bg-slate-200 rounded`}/>}
    {data?.[indexInPage].name}
  </>;
}

export const Lazy: StoryObj = {
  parameters: {
    docs: {
      source: {
        type: `code`,
      },
    },
  },
  args: {
    className: `classic`,
    placeholder: `Click to select a value...`,
  },
  render: props => {
    const filter = /*sql*/ `
      SELECT id, name FROM cards ORDER BY name
    `;

    const query = useQuery(sql<{
      count: number;
    }>(/*sql*/ `
      SELECT COUNT(*) AS count FROM (${filter})
    `));

    const options = query && Array.from({length: query.data?.[0].count ?? 0}, (_, i) => ({
      label: <LazyCard filter={filter} pageSize={20} index={i}/>,
      value: i,
    }));

    const [value, setValue] = useState<number | undefined>();
    return <Select {...props} options={options} value={value} onChange={setValue}/>;
  },
};

export const Grouped: StoryObj = {
  args: {
    className: `classic`,
    placeholder: `Click to select a value...`,
  },
  render: props => {
    const query = useQuery(sql<{
      id: string;
      name: string;
      set_name: string;
      released_at: string;
    }>(/*sql*/ `
      SELECT c.id, c.name, s.name AS set_name, s.released_at
      FROM cards c
      LEFT JOIN sets s ON c.set_code = s.code
      WHERE EXISTS(SELECT 1 FROM json_each(c.types) WHERE json_each.value = 'legendary')
      ORDER BY s.released_at, s.name, c.name ASC
    `));

    const grouped = Object.groupBy(query.data ?? [], card => {
      return `${card.set_name} — ${card.released_at.replace(/-.*/, ``)}`;
    });

    const options = Object.entries(grouped).map(([setName, cards]) => ({
      label: setName,
      options: cards?.map(card => ({
        label: card.name,
        value: card.id,
      })),
    }));

    const [value, setValue] = useState<string | undefined>();
    return <Select {...props} options={options} value={value} onChange={setValue}/>;
  },
};

function FancyCard({card}: {card: {id: string, name: string, setCode: string, types: string, subtypes: string}}) {
  const types = JSON.parse(card.types);
  const subtypes = JSON.parse(card.subtypes);

  return (
    <div className={`flex items-center space-x-2`}>
      <img src={`https://svgs.scryfall.io/sets/${card.setCode}.svg`} className={`flex-none w-4 h-4`}/>
      <div className={`flex-none w-64 truncate`}>
        {card.name}
      </div>
      <div className={`text-slate-400 truncate`}>
        {types.join(` `)}{subtypes.length > 0 ? ` — ${subtypes.join(` `)}` : ``}
      </div>
    </div>
  );
}

export const Fancy: StoryObj = {
  parameters: {
    docs: {
      source: {
        type: `code`,
      },
    },
  },
  args: {
    className: `classic`,
    placeholder: `Click to select a value...`,
  },
  render: props => {
    const query = useQuery(sql<Parameters<typeof FancyCard>[0][`card`]>(/*sql*/ `
      SELECT id, name, set_code AS setCode, types, subtypes FROM cards ORDER BY name
    `));

    const options = query.data?.map(card => ({
      label: <FancyCard card={card}/>,
      value: card.id as string,
    })) ?? [];

    const [value, setValue] = useState<string | undefined>();
    return <Select {...props} options={options} value={value} onChange={setValue}/>;
  },
};

export const Search: StoryObj = {
  args: {
    className: `classic`,
    placeholder: `Click to select a value...`,
  },
  render: props => {
    const query = useQuery(sql<{
      id: string;
      name: string;
    }>(/*sql*/ `
      SELECT id, name FROM cards ORDER BY name
    `));

    const options = query.data?.map(card => ({
      label: card.name,
      search: card.name,
      value: card.id,
    })) ?? [];

    const [value, setValue] = useState<string | undefined>();
    return <Select {...props} enableTextMode={true} options={options} value={value} onChange={setValue}/>;
  },
};

export const CustomSearch: StoryObj = {
  parameters: {
    docs: {
      source: {
        type: `code`,
      },
    },
  },
  args: {
    className: `classic`,
    placeholder: `Click to select a value...`,
  },
  render: props => {
    const [search, setSearch] = useState<string>(``);

    const [where, args] = useSearch(search, {
      default: `name`,
      fields: {
        name: operators.string(`c.name`),
        cmc: operators.number(`c.cmc`),
        type: operators.merge([
          operators.stringArray(`c.types`),
          operators.stringArray(`c.subtypes`),
        ]),
        set: operators.merge([
          operators.string(`c.set_code`),
          operators.string(`s.name`),
        ]),
      },
    });

    const query = useQuery(sql<{
      id: string;
      name: string;
      setCode: string;
      types: string;
      subtypes: string;
    }>(/*sql*/ `
      SELECT c.id, c.name, s.code AS setCode, c.types, c.subtypes
      FROM cards c
      LEFT JOIN sets s ON c.set_code = s.code
      WHERE ${where}
      ORDER BY c.name
    `, args));

    const options = query.data?.map(card => ({
      label: <FancyCard card={card}/>,
      value: card.id,
    })) ?? [];

    const [value, setValue] = useState<string | undefined>();
    return <Select {...props} enableTextMode={true} options={options} value={value} onChange={setValue} onSearchChange={setSearch}/>;
  },
};
