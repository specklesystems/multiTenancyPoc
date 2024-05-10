import { Knex } from "knex";
import { knex } from "../../db";
type Thing = {
  id: string;
  name: string;
};

type ServedThing = {
  foo: number;
} & Thing;

// talk to the DB
const repo =
  ({ db }: { db: Knex<Thing> }) =>
  async (id: string): Promise<Thing | null> => {
    return (await db().where({ id }).first()) ?? null;
  };

// business / domain logic
const service =
  ({ thingGetter }: { thingGetter: (id: string) => Promise<Thing | null> }) =>
  async (id: string): Promise<ServedThing | null> => {
    const thing = await thingGetter(id);
    const foo = 123;
    return thing ? { ...thing, foo } : null;
  };

// graphql entry
export const resolver = async (id: string): Promise<ServedThing> => {
  const thing = await service({ thingGetter: repo({ db: knex }) })(id);
  if (!thing) throw new Error("not found");
  return thing;
};
