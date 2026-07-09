import { useState } from "react";
import { apiPost } from "../api";
import { toDriverErrorMessage } from "../driverErrors";

type Translator = (key: string) => string;

export function useFeedbackForm(activeSessionId?: number | null) {
  const [feedbackType, setFeedbackType] = useState("Suggestion");
  const [feedbackContent, setFeedbackContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(authToken: string, userId: number, t: Translator) {
    if (!feedbackContent.trim()) {
      setMessage(t("driver.feedbackValidation"));
      return;
    }
    setSubmitting(true);
    setMessage("");
    try {
      await apiPost(
        "/api/feedbacks",
        {
          userId,
          sessionId: activeSessionId ?? null,
          feedbackType,
          content: feedbackContent.trim(),
        },
        authToken,
      );
      setFeedbackContent("");
      setMessage(t("driver.feedbackSuccess"));
    } catch (e) {
      setMessage(toDriverErrorMessage(e, t, t("driver.feedbackFailed")));
    } finally {
      setSubmitting(false);
    }
  }

  return {
    feedbackType,
    setFeedbackType,
    feedbackContent,
    setFeedbackContent,
    submitting,
    message,
    setMessage,
    submit,
  };
}
