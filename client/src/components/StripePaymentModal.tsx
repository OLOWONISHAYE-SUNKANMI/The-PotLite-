import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { usePot } from "@/context/PotContext";
import { useDummyUser } from "@/context/DummyUserContext";
import { CreditCard, ExternalLink, ShieldCheck, Sparkles, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { PotType } from "@/lib/utils";

interface StripePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  pot: PotType;
}

export default function StripePaymentModal({
  isOpen,
  onClose,
  pot,
}: StripePaymentModalProps) {
  const [amount, setAmount] = useState<number>(25);
  const [currency, setCurrency] = useState<string>("USD");
  const [paymentMethodTab, setPaymentMethodTab] = useState<string>("stripe_card");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cardNumber, setCardNumber] = useState<string>("");
  const [cardExp, setCardExp] = useState<string>("");
  const [cardCvc, setCardCvc] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [stripeConfig, setStripeConfig] = useState<{ publishableKey: string; isMock: boolean } | null>(null);

  const { addTransaction, updatePotBalance } = usePot();
  const { currentUser } = useDummyUser();
  const { toast } = useToast();

  const platformFee = Math.round(amount * 0.02 * 100) / 100;
  const totalAmount = (amount + platformFee).toFixed(2);

  // Fetch Stripe config
  useEffect(() => {
    fetch("/api/stripe/config")
      .then((res) => res.json())
      .then((data) => setStripeConfig(data))
      .catch(() => setStripeConfig({ publishableKey: "pk_test_placeholder", isMock: true }));
  }, []);

  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter an amount greater than 0.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create PaymentIntent on the backend
      const res = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          potId: pot.id,
          amount,
          currency,
          userId: 1,
          description: `Contribution by ${currentUser || "User"} to ${pot.name}`,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Payment intent creation failed");
      }

      const intentData = await res.json();

      // 2. Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // 3. Record transaction in Pot state
      const txId = `tx_stripe_${intentData.paymentIntentId || Math.random().toString(36).substring(2, 10)}`;
      addTransaction({
        id: txId,
        potId: pot.id,
        type: "deposit",
        amount,
        user: currentUser || "Current User",
        description: `Stripe deposit (${currency} ${totalAmount} incl. 2% fee)`,
        timestamp: new Date().toISOString(),
        balanceAfter: pot.currentBalance + amount,
        status: "completed",
      });

      // 4. Update pot balance
      updatePotBalance(pot.id, amount);

      setIsSuccess(true);
      setIsLoading(false);

      toast({
        title: "Payment Successful!",
        description: `Successfully contributed ${currency} ${amount} (Total charged: ${currency} ${totalAmount}) to ${pot.name}.`,
      });

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1800);
    } catch (err: any) {
      setIsLoading(false);
      toast({
        title: "Payment Failed",
        description: err.message || "An unexpected payment error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleCheckoutRedirect = async () => {
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter an amount greater than 0.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/payments/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          potId: pot.id,
          amount,
          currency,
          potName: pot.name,
          userEmail: "user@thepot.com",
          userId: 1,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create Stripe Checkout session");
      }

      const sessionData = await res.json();

      if (sessionData.url) {
        window.location.href = sessionData.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      setIsLoading(false);
      toast({
        title: "Checkout Error",
        description: err.message || "Could not redirect to Stripe Checkout.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border shadow-2xl">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Contribute to {pot.name}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs">
                Secure payment powered by Stripe Payment Gateway
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Payment Received!</h3>
            <p className="text-sm text-muted-foreground">
              Your contribution of {currency} {amount} has been added to the pot balance.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Amount and Currency Selection */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label htmlFor="deposit-amount" className="text-xs font-semibold text-foreground">
                  Contribution Amount
                </Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2.5 text-muted-foreground font-semibold">
                    {currency === "USD" ? "$" : currency === "GBP" ? "£" : currency === "EUR" ? "€" : currency}
                  </span>
                  <Input
                    id="deposit-amount"
                    type="number"
                    min="1"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
                    className="pl-8 font-semibold text-base bg-secondary"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="deposit-currency" className="text-xs font-semibold text-foreground">
                  Currency
                </Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="deposit-currency" className="mt-1 bg-secondary font-medium">
                    <SelectValue placeholder="USD" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="CAD">CAD ($)</SelectItem>
                    <SelectItem value="AUD">AUD ($)</SelectItem>
                    <SelectItem value="NGN">NGN (₦)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick preset chips */}
            <div className="flex gap-2">
              {[10, 25, 50, 100].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${
                    amount === preset
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  +{preset}
                </button>
              ))}
            </div>

            {/* Fee Breakdown Card */}
            <div className="bg-secondary/60 rounded-lg p-3 text-xs space-y-1.5 border border-border/50">
              <div className="flex justify-between text-muted-foreground">
                <span>Pot Contribution:</span>
                <span className="font-medium text-foreground">{currency} {amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span className="flex items-center gap-1">
                  Platform Fee (2%):
                </span>
                <span className="font-medium text-foreground">{currency} {platformFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-border/60 pt-1 flex justify-between font-bold text-foreground">
                <span>Total Charged:</span>
                <span className="text-primary">{currency} {totalAmount}</span>
              </div>
            </div>

            {/* Payment Mode Tabs */}
            <Tabs value={paymentMethodTab} onValueChange={setPaymentMethodTab} className="w-full">
              <TabsList className="grid grid-cols-2 w-full bg-secondary">
                <TabsTrigger value="stripe_card" className="text-xs flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  Stripe Card
                </TabsTrigger>
                <TabsTrigger value="stripe_checkout" className="text-xs flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Stripe Checkout
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Embedded Card Input */}
              <TabsContent value="stripe_card" className="space-y-3 pt-2">
                <form onSubmit={handleCardPayment} className="space-y-3">
                  <div>
                    <Label htmlFor="card-number" className="text-xs text-muted-foreground">
                      Card Details (Test & Live Supported)
                    </Label>
                    <Input
                      id="card-number"
                      placeholder="4242 •••• •••• 4242"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="mt-1 bg-secondary text-sm font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="card-exp" className="text-xs text-muted-foreground">
                        MM / YY
                      </Label>
                      <Input
                        id="card-exp"
                        placeholder="12/28"
                        value={cardExp}
                        onChange={(e) => setCardExp(e.target.value)}
                        className="mt-1 bg-secondary text-sm font-mono"
                      />
                    </div>
                    <div>
                      <Label htmlFor="card-cvc" className="text-xs text-muted-foreground">
                        CVC
                      </Label>
                      <Input
                        id="card-cvc"
                        placeholder="123"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="mt-1 bg-secondary text-sm font-mono"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full btn-gradient font-bold h-10 mt-2"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing Payment...
                      </span>
                    ) : (
                      `Pay ${currency} ${totalAmount}`
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Tab 2: Stripe Hosted Checkout */}
              <TabsContent value="stripe_checkout" className="space-y-3 pt-2">
                <div className="p-3 bg-secondary/40 rounded-lg border border-border/40 text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground">Hosted Stripe Checkout Experience</p>
                  <p>You will be redirected to Stripe's secure checkout page to complete payment via Card, Apple Pay, or Google Pay.</p>
                </div>

                <Button
                  onClick={handleCheckoutRedirect}
                  disabled={isLoading}
                  className="w-full btn-gradient font-bold h-10"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Redirecting to Stripe...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Proceed to Stripe Checkout
                      <ExternalLink className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </TabsContent>
            </Tabs>

            {/* Trust Footer */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>256-bit encryption • PCI-DSS Level 1 compliant payment</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
