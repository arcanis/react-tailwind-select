import {ScryfallCard} from '@scryfall/api-types';
import fs             from 'fs';
import path           from 'path';
import initSqlJs      from 'sql.js';

const SQL = await initSqlJs();
const db = new SQL.Database();

const json = JSON.parse(fs.readFileSync(process.argv[2], `utf-8`)) as Array<ScryfallCard.Any>;

db.run(/*sql*/`
  CREATE TABLE cards (id PRIMARY KEY, name, types, subtypes, cmc, power, toughness, set_code);
  CREATE TABLE sets (code PRIMARY KEY, name, released_at);
`);

const insertCard = db.prepare(/*sql*/`
  INSERT INTO cards (id, name, types, subtypes, cmc, power, toughness, set_code) VALUES (:id, :name, :types, :subtypes, :cmc, :power, :toughness, :set_code);
`);

const insertSet = db.prepare(/*sql*/`
  INSERT INTO sets (code, name, released_at) VALUES (:set_code, :set_name, :released_at) ON CONFLICT(code) DO NOTHING;
`);

for (const card of json) {
  if (Object.values(card.legalities).every(legality => legality === `not_legal`))
    continue;

  if (card.promo || card.digital || !(`type_line` in card))
    continue;

  const typeSegments = card.type_line.toLowerCase().split(` — `);
  const cardTypes = typeSegments[0].split(` `);
  const cardSubtypes = typeSegments[1]?.split(` `) ?? [];

  type KeysOfUnion<T> = T extends T ? keyof T : never;
  type Nullify<T> = T extends undefined ? Exclude<T, undefined> | null : T;

  const maybe = <T extends object, K extends KeysOfUnion<T>>(object: T, key: K): Nullify<Extract<T, {[_ in K]?: any}>[K]> => {
    return (key in object ? object[key] as any : undefined) ?? null;
  };

  insertCard.run({
    ':id': card.id,
    ':name': card.name,
    ':types': JSON.stringify(cardTypes),
    ':subtypes': JSON.stringify(cardSubtypes),
    ':cmc': card.cmc,
    ':power': maybe(card, `power`),
    ':toughness': maybe(card, `toughness`),
    ':set_code': card.set,
  });

  insertSet.run({
    ':set_code': card.set,
    ':set_name': card.set_name,
    ':released_at': card.released_at,
  });
}

const binaryArray = db.export();
fs.writeFileSync(path.join(import.meta.dirname, `public/demo.db`), binaryArray);
