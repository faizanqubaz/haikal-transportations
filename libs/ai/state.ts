import {
  Annotation,
  messagesStateReducer,
} from "@langchain/langgraph";

import type { BaseMessage } from "@langchain/core/messages";

export const BookingAssistantState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),

  language: Annotation<"en" | "ur">({
    reducer: (_, next) => next,
    default: () => "en",
  }),
});

export type BookingAssistantStateType =
  typeof BookingAssistantState.State;