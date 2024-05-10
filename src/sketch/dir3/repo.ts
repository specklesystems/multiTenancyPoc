import { Knex } from "knex";
import { Thing } from "./domain";

const findThing =
  ({ db }: { db: Knex }) =>
  async (id: string): Promise<Thing | null> => {
    return null;
  };

export const thingRepo = ({ db }: { db: Knex }) => ({
  findThing: findThing({ db }),
});
