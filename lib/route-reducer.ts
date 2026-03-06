import type { RouteState, RouteAction } from "@/types/route-builder";
import { thisMonthFirst } from "@/lib/date-utils";

export const INITIAL_ROUTE_STATE: RouteState = {
  title: "無題のルート",
  startDate: thisMonthFirst(),
  months: 12,
  items: [],
  selectedItemId: null,
};

export function routeReducer(state: RouteState, action: RouteAction): RouteState {
  switch (action.type) {
    case "SET_TITLE":
      return { ...state, title: action.title };

    case "SET_START_DATE":
      return { ...state, startDate: action.date };

    case "SET_MONTHS":
      return { ...state, months: action.months };

    case "ADD_ITEM":
      return {
        ...state,
        items: [...state.items, { ...action.item, sortIndex: state.items.length }],
      };

    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items
          .filter((item) => item.id !== action.itemId)
          .map((item, i) => ({ ...item, sortIndex: i })),
        selectedItemId:
          state.selectedItemId === action.itemId ? null : state.selectedItemId,
      };

    case "UPDATE_ITEM":
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.itemId ? { ...item, ...action.changes } : item,
        ),
      };

    case "REORDER_ITEMS": {
      const lookup = new Map(state.items.map((item) => [item.id, item]));
      return {
        ...state,
        items: action.itemIds
          .map((id, i) => {
            const item = lookup.get(id);
            return item ? { ...item, sortIndex: i } : null;
          })
          .filter((item): item is NonNullable<typeof item> => item !== null),
      };
    }

    case "SELECT_ITEM":
      return { ...state, selectedItemId: action.itemId };

    case "LOAD_ROUTE":
      return action.state;

    default:
      return state;
  }
}
