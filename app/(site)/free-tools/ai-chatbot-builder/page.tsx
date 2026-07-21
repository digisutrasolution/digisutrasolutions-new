import type { Metadata } from "next";
import AiToolForm from "@/components/tools/AiToolForm";
import ToolShell from "@/components/tools/ToolShell";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "AI Chatbot Builder: Free Conversation Flow Generator",
  description:
    "Plan a website chatbot in seconds — greeting, qualifying questions, pricing answers, lead capture and human handoff, written for your business.",
  alternates: { canonical: `${SITE_URL}/free-tools/ai-chatbot-builder` },
};

export default function AiChatbotBuilderPage() {
  return (
    <ToolShell
      slug="ai-chatbot-builder"
      title="AI chatbot"
      titleAccent="flow builder"
      intro="Describe your business and what the bot should achieve — get a complete conversation flow, from greeting to lead capture and handoff."
    >
      <AiToolForm
        kind="chatbot-flow"
        cta="Build my flow"
        fields={[
          { name: "business", label: "Your business", placeholder: "Interior design studio in Noida", required: true },
          { name: "goal", label: "What should the bot achieve?", placeholder: "book site visits" },
        ]}
        note="This is the script, not the software. We build the working bot — website, WhatsApp and CRM handoff — from ₹15,000; ask for a quote in the free expert call."
      />
    </ToolShell>
  );
}
