"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const questions = [
  [
    "What are Control Nest and AutoPiHub?",
    "Control Nest is the app on your phone. AutoPiHub runs on your Raspberry Pi and controls connected devices and schedules. We manage the shared API and Cloudflare tunnels.",
  ],
  [
    "Do I need special smart bulbs or switches?",
    "AutoPiHub controls devices through Raspberry Pi GPIO and suitable relays. Choose hardware rated for your devices, and use a qualified electrician for mains wiring.",
  ],
  [
    "Can I control my home when I am away?",
    "Yes. Pairing sets up remote access through the shared service. Keep your Pi powered on and connected to the internet, then sign in to Control Nest on your phone.",
  ],
  [
    "Do I need to set up a cloud service?",
    "No. We provide the API and Cloudflare tunnels. Install AutoPiHub on your Pi and pair it in the app. You do not need a separate server or Cloudflare account.",
  ],
  [
    "Where can I get the mobile app?",
    "Download the Android APK from the setup guide. Install it on your phone, then follow the pairing steps to connect your Pi.",
  ],
];

export function FAQ() {
  return (
    <Accordion type="single" collapsible className="faq-list">
      {questions.map(([question, answer], index) => (
        <AccordionItem key={question} value={`question-${index}`}>
          <AccordionTrigger>{question}</AccordionTrigger>
          <AccordionContent>{answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
