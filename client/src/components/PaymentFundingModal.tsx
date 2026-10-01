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
import { useToast } from "@/hooks/use-toast";
import { usePot } from "@/context/PotContext";
import { useDummyUser } from "@/context/DummyUserContext";
import {
  Building2,
  CreditCard,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Info,
  Wallet,
  Zap,
} from "lucide-react";
import { PotType } from "@/lib/utils";

interface PaymentFundingModalProps {
  isOpen: boolean;
  onClose: () => void;
  pot: PotType;
}

export default function PaymentFundingModal({
  isOpen,
  onClose,
  pot,
}: PaymentFundingModalProps) {
  const [amount, setAmount] = useState<number>(25);
  const [paymentRail, setPaymentRail] = useState<"ach" | "card">("ach");
  const [fundingSource, setFundingSource] = useState<"bank_ach" | "moov_wallet">("bank_ach");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [lastPaymentResult, setLastPaymentResult] = useState<any>(null);

  // Bank form state
  const [routingNumber, setRoutingNumber] = useState<string>("812345678");
  const [accountNumber, setAccountNumber] = useState<string>("1018733994");
  const [accountHolder, setAccountHolder] = useState<string>("Maurice Lewis Jr");

  // Card form state
  const [cardNumber, setCardNumber] = useState<string>("4242 4242 4242 4242");
  const [cardExp, setCardExp] = useState<string>("12/28");
  const [cardCvc, setCardCvc] = useState<string>("123");

  // Fee engine calculations
  const [feeBreakdown, setFeeBreakdown] = useState<any>({
    grossDollars: 25,
    feeDollars: 0,
    netDollars: 25,
    isFeeWaived: true,
  });

  const { addTransaction, updatePotBalance } = usePot();
  const { currentUser } = useDummyUser();
  const { toast } = useToast();

  // Fetch fee breakdown whenever amount changes
  useEffect(() => {
    if (amount > 0) {
      fetch(`/api/payments/fees?amount=${amount}&isPersonal=true`)
        .then((res) => res.json())
        .then((data) => setFeeBreakdown(data))
        .catch(() => {
          const waived = amount >= 100;
          setFeeBreakdown({
            grossDollars: amount,
            feeDollars: waived ? 0 : amount * 0.02,
            netDollars: waived ? amount : amount * 0.98,
            isFeeWaived: waived,
          });
        });
    }
  }, [amount]);

  const handleSubmit = async (e: React.FormEvent) => {
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
      // Call agnostic funding API (routed by orchestrator to Moov for ACH/Wallet)
      const res = await fetch("/api/payments/funding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          potId: pot.id,
          amount, // in dollars, backend converts to cents
          paymentRail,
          userId: 1,
          description: `Deposit to ${pot.name} via ${
            paymentRail === "ach"
              ? fundingSource === "moov_wallet"
                ? "Moov Digital Wallet"
                : "Moov Bank ACH"
              : "Stripe Card"
          }`,
          sourceToken: paymentRail === "ach" ? "pm_moov_verified_bank_01" : undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Payment processing failed");
      }

      const result = await res.json();
      setLastPaymentResult(result);

      // Record in local state for immediate visual feedback
      const txId = `tx_${result.provider}_${result.providerPaymentId || Date.now()}`;
      const providerLabel =
        result.provider === "moov"
          ? fundingSource === "moov_wallet"
            ? "Moov Digital Wallet"
            : "Moov Bank ACH"
          : "Stripe Card";

      addTransaction({
        id: txId,
        potId: pot.id,
        type: "deposit",
        amount,
        user: currentUser || "User",
        timestamp: new Date().toISOString(),
        status: "completed",
        description: `Deposit via ${providerLabel}`,
      });

      updatePotBalance(pot.id, amount);
      setIsSuccess(true);

      toast({
        title: "Deposit Successful! 🎉",
        description: `Deposited $${amount.toFixed(2)} into ${pot.name} via ${providerLabel}.`,
      });
    } catch (err: any) {
      toast({
        title: "Funding Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setLastPaymentResult(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleReset}>
      <DialogContent className="sm:max-w-[540px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <ShieldCheck className="w-6 h-6 text-primary" />
            Fund {pot.name}
          </DialogTitle>
          <DialogDescription>
            Choose your preferred payment rail. <strong>Moov Financial</strong> powers our low-fee ACH and digital wallets; Stripe powers card payments.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-6 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Deposit Confirmed</h3>
              <p className="text-muted-foreground text-sm mt-1">
                ${amount.toFixed(2)} has been credited to your Pot ledger.
              </p>
            </div>

            <div className="w-full bg-muted/40 rounded-xl p-4 text-left text-sm space-y-2 border border-border">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Provider:</span>
                <span className="font-semibold capitalize text-emerald-600 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-500" />
                  {lastPaymentResult?.provider === "moov"
                    ? "Moov Financial (Primary Gateway)"
                    : lastPaymentResult?.provider === "unit"
                    ? "Unit Banking"
                    : "Stripe Card Elements"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Payment Rail:</span>
                <span className="font-semibold uppercase tracking-wider text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                  {lastPaymentResult?.paymentRail || paymentRail}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Transaction ID:</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {lastPaymentResult?.providerPaymentId || "pay_moov_mock_01"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Platform Fee:</span>
                <span className="font-semibold text-emerald-600">
                  {feeBreakdown.isFeeWaived ? "$0.00 (Waived)" : `$${feeBreakdown.feeDollars.toFixed(2)}`}
                </span>
              </div>
            </div>

            <Button onClick={handleReset} className="w-full mt-2 btn-gradient font-semibold">
              Done & Return to Dashboard
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Amount Selection */}
            <div>
              <Label className="text-sm font-semibold">Deposit Amount (USD)</Label>
              <div className="relative mt-1.5">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-lg">$</span>
                <Input
                  type="number"
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="pl-8 text-lg font-bold"
                  placeholder="25.00"
                  required
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex gap-2 mt-2">
                {[10, 25, 50, 100, 250].map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant={amount === preset ? "default" : "outline"}
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setAmount(preset)}
                  >
                    ${preset}
                  </Button>
                ))}
              </div>
            </div>

            {/* Commercial Fee Highlight */}
            {amount >= 100 ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span><strong>$100+ Benefit:</strong> Platform fee waived! 100% of your deposit goes into your Pot.</span>
              </div>
            ) : (
              <div className="bg-muted/40 rounded-lg p-3 text-xs text-muted-foreground flex items-center justify-between border border-border">
                <span>Standard 2% platform fee applies below $100:</span>
                <span className="font-semibold">${(amount * 0.02).toFixed(2)}</span>
              </div>
            )}

            {/* Provider Rail Tabs */}
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Payment Gateway Rail</Label>
              <Tabs value={paymentRail} onValueChange={(val: any) => setPaymentRail(val)} className="w-full">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="ach" className="flex items-center gap-1.5 text-xs font-semibold py-2">
                    <Building2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    Moov ACH & Wallet
                    <span className="ml-1 text-[10px] bg-emerald-500/20 text-emerald-600 px-1.5 py-0.5 rounded-full font-bold">
                      Primary
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="card" className="flex items-center gap-1.5 text-xs font-semibold py-2">
                    <CreditCard className="w-4 h-4 text-blue-500 shrink-0" />
                    Card (Stripe)
                    <span className="ml-1 text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                      Secondary
                    </span>
                  </TabsTrigger>
                </TabsList>

                {/* Moov ACH & Wallet Details */}
                <TabsContent value="ach" className="mt-3 space-y-3 bg-muted/20 border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border text-xs">
                    <span className="text-muted-foreground font-medium">Gateway Partner</span>
                    <span className="font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Moov Financial API
                    </span>
                  </div>

                  {/* Funding Source Toggle */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFundingSource("bank_ach")}
                      className={`p-2.5 rounded-lg border text-left flex items-start gap-2 transition-colors ${
                        fundingSource === "bank_ach"
                          ? "border-emerald-500 bg-emerald-500/10 text-foreground"
                          : "border-border hover:bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold block">Bank ACH Debit</span>
                        <span className="text-[10px] opacity-80 block">Lowest fees, direct bank pull</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFundingSource("moov_wallet")}
                      className={`p-2.5 rounded-lg border text-left flex items-start gap-2 transition-colors ${
                        fundingSource === "moov_wallet"
                          ? "border-emerald-500 bg-emerald-500/10 text-foreground"
                          : "border-border hover:bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      <Wallet className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold block">Moov Wallet</span>
                        <span className="text-[10px] opacity-80 block">Instant ledger transfer</span>
                      </div>
                    </button>
                  </div>

                  {fundingSource === "bank_ach" ? (
                    <>
                      <div>
                        <Label className="text-xs text-muted-foreground">Account Holder</Label>
                        <Input
                          value={accountHolder}
                          onChange={(e) => setAccountHolder(e.target.value)}
                          className="h-8 text-xs mt-1"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Routing Number</Label>
                          <Input
                            value={routingNumber}
                            onChange={(e) => setRoutingNumber(e.target.value)}
                            className="h-8 text-xs font-mono mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Account Number</Label>
                          <Input
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            className="h-8 text-xs font-mono mt-1"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-3 bg-muted/40 border border-border rounded-lg text-xs space-y-1">
                      <div className="flex justify-between items-center font-medium">
                        <span>Personal Moov Wallet:</span>
                        <span className="font-mono text-emerald-600">wallet_moov_user_01</span>
                      </div>
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>Available Balance:</span>
                        <span className="font-bold text-foreground">$500.00</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground block pt-1">
                        Transfers from your personal wallet to group pots are 100% free and instant.
                      </span>
                    </div>
                  )}

                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 pt-1">
                    <Info className="w-3.5 h-3.5 shrink-0 text-primary" />
                    Powered by Moov: flat-fee ACH, zero card interchange overhead, 24/7 wallet ledgering.
                  </p>
                </TabsContent>

                {/* Stripe Card Details */}
                <TabsContent value="card" className="mt-3 space-y-3 bg-muted/20 border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border text-xs">
                    <span className="text-muted-foreground font-medium">Card Processing Rail</span>
                    <span className="font-semibold text-blue-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Stripe Connect
                    </span>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Card Number</Label>
                    <Input
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="h-8 text-xs font-mono mt-1"
                      placeholder="4242 4242 4242 4242"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Expiration</Label>
                      <Input
                        value={cardExp}
                        onChange={(e) => setCardExp(e.target.value)}
                        className="h-8 text-xs font-mono mt-1"
                        placeholder="MM/YY"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">CVC</Label>
                      <Input
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="h-8 text-xs font-mono mt-1"
                        placeholder="123"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Total and Submit */}
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground block">Total to be debited</span>
                <span className="text-xl font-extrabold text-foreground">
                  ${amount > 0 ? (amount + (feeBreakdown.isFeeWaived ? 0 : amount * 0.02)).toFixed(2) : "0.00"}
                </span>
              </div>
              <Button type="submit" disabled={isLoading || amount <= 0} className="px-6 gap-2 btn-gradient font-bold shadow-md shadow-primary/20">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing via Moov...
                  </>
                ) : (
                  <>
                    Fund Pot
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
