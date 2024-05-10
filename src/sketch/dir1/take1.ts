import { knex } from "../../db";
import { Knex } from "knex";

type Thing = {
  id: string;
  name: string;
};

// talk to the DB
const repo =
  (db: Knex<Thing>) =>
  async (id: string): Promise<Thing | null> => {
    return (await db.where({ id }).first()) ?? null;
  };

// business / domain logic
const service =
  (thingGetter: (id: string) => Promise<Thing | null>) =>
  async (id: string): Promise<Thing | null> => {
    return thingGetter(id);
  };

const getThingClient = (id: string | undefined): Knex => {
  if (!id) return knex;
  return knex;
};

// graphql entry
export const resolver = async (args: { id: string }): Promise<Thing> => {
  const thing = await service(repo(getThingClient(args.id)))(args.id);
  if (!thing) throw new Error("not found");
  return thing;
};
