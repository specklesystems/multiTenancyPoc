import { ServedThing, service } from "./services/service";
import { thingRepo } from "./repo";
import { knex } from "../../db";

export const resolver = async (id: string): Promise<ServedThing> => {
  const thing = await service({
    thingRepo: thingRepo({ db: knex }),
  })(id);
  if (!thing) throw new Error("not found");
  return thing;
};
