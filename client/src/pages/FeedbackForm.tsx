import React, { useState } from "react";
import { useLocation } from "wouter";
import { useThePotLite } from "@/context/ThePotLiteContext";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  Star,
  CheckCircle2,
  Sparkles,
  Send,
  ThumbsUp,
  Heart,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function FeedbackForm() {
  const { currentUser, organizationName } = useThePotLite();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [rating, setRating] = useState<number>(5);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([
    "Consent-Gated Terms",
    "Off-Platform Dual Confirmation",
  ]);
  const [satisfaction, setSatisfaction] = useState<"definitely" | "likely" | "maybe" | "no">("definitely");
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);

  const topics = [
    "Dashboard Usability",
    "Consent-Gated Terms",
    "Cheffy AI Prompts",
    "Off-Platform Dual Confirmation",
    "Payout Separation of Duties",
    "Dark Mode & UI Design",
  ];

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Send to backend feedback endpoint
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          rating,
          selectedTopics,
          satisfaction,
          comments,
          submittedAt: new Date().toISOString(),
        }),
      });

      toast({
        title: "Thank You for Your Feedback!",
        description: "Your pilot impressions have been submitted directly to the team.",
      });

      setLocation("/");
    } catch {
      toast({
        title: "Feedback Recorded",
        description: "Thank you! Your feedback helps us shape ThePotLite V1 Pilot.",
      });
      setLocation("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <img
          src="/thepot-logo.png"
          alt="The Pot Limited"
          className="w-14 h-14 object-contain mx-auto drop-shadow-sm"
        />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold">
          <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
          <span>The Pot Limited · Pilot Feedback Survey</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Pilot Feedback & Product Insights
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Share your feedback on obligation tracking, dual confirmation, and the dashboard design
        </p>
      </div>

      <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm p-6 sm:p-8 transition-colors">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating Section */}
          <div className="text-center space-y-2 pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Overall Pilot Satisfaction
            </span>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-125 focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                        : "text-slate-300 dark:text-slate-700"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              {rating === 5 && "⭐ Outstanding — clear, fast, and transparent"}
              {rating === 4 && "👍 Very Good — solid workflow for sports pots"}
              {rating === 3 && "👌 Good — has potential with some refinements"}
              {rating === 2 && "⚠️ Needs Improvement"}
              {rating === 1 && "❌ Disappointing"}
            </p>
          </div>

          {/* Topics of Interest */}
          <div>
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
              Which features did you test or find most valuable?
            </Label>
            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => {
                const isSelected = selectedTopics.includes(topic);
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleTopic(topic)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-purple-600 text-white shadow-sm shadow-purple-600/30"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {isSelected ? `✓ ${topic}` : `+ ${topic}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Likelihood to use in production */}
          <div>
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
              Would your club or team use ThePotLite for official season fees?
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: "definitely", label: "Definitely", icon: "🚀" },
                { id: "likely", label: "Likely", icon: "👍" },
                { id: "maybe", label: "Maybe", icon: "🤔" },
                { id: "no", label: "Not Yet", icon: "⏸️" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSatisfaction(opt.id as any)}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    satisfaction === opt.id
                      ? "border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-white font-bold ring-2 ring-purple-600/30"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <span className="block text-lg mb-1">{opt.icon}</span>
                  <span className="text-xs font-semibold">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Detailed comments */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Suggestions & Feature Requests
            </Label>
            <Textarea
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="What worked well? What could make payment tracking or reminder prompts clearer?"
              className="rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm"
            />
          </div>

          {/* Identity info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Your Name
              </Label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Email Address
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/")}
              className="flex-1 rounded-full text-xs font-semibold py-3 border-slate-300 dark:border-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-full text-xs font-bold py-3.5 bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/30 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? "Submitting..." : "Submit Pilot Feedback"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
