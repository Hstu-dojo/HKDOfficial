import { authMiddlweware } from "./authentication";
import { chain } from "./chain";
import { localeMiddlweware } from "./internationalization";

export default chain([authMiddlweware, localeMiddlweware]);

export const config = {
  matcher: [
    "/((?!api|docs|static|.*\\..*|_next|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
