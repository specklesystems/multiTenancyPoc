import { knex } from "../../db";
type Thing = {
  id: string;
  name: string;
};

const Things = () => knex<Thing>("things");

// talk to the DB
const repo = async (id: string): Promise<Thing | null> => {
  return (await Things().where({ id }).first()) ?? null;
};

// business / domain logic
const service = async (id: string): Promise<Thing | null> => {
  return repo(id);
};

// graphql entry
export const resolver = async (id: string): Promise<Thing> => {
  const thing = await service(id);
  if (!thing) throw new Error("not found");
  return thing;
};
