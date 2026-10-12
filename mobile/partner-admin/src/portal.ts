import { partnerNavigation } from "../shared/navigation";
export const portalGroups = partnerNavigation.map((group) => ({
  title: group.title,
  items: group.items.map((item) => ({
    name: item.label,
    path: item.href,
    icon: item.nativeIcon,
  })),
}));
