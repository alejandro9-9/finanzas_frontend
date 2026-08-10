import { apiRequest } from "./client";
import type {
  CreateFeedbackMessageRequest,
  CreateFeedbackMessageResponse,
  FeedbackMessageResponse,
} from "./contracts";

export function createFeedbackMessage(
  request: CreateFeedbackMessageRequest,
) {
  return apiRequest<CreateFeedbackMessageResponse>(
    "/api/feedback-messages",
    {
      method: "POST",
      body: JSON.stringify(request),
    },
  );
}

export function getFeedbackMessages() {
  return apiRequest<FeedbackMessageResponse[]>("/api/feedback-messages");
}
