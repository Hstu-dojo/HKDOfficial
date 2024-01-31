import { stackMiddlewares } from "@/middlewares/stackHandler";
import { withUser } from "@/middlewares/withUser";

const middlewares = [withUser];
export default stackMiddlewares(middlewares);
