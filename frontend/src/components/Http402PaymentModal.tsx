import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { PrivateKey, Transaction, P2PKH } from '@bsv/sdk';
import { Copy, Check, Loader2, Info } from 'lucide-react';
import toast from 'react-hot-toast';

interface PaymentDetails {
  currency: string;
  amount: number;
  amountUSD: number;
  address: string;
  reference: string;
  expiresIn: number;
  expiresAt: string;
}

interface Http402PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: (txId: string, accessToken: string) => void;
  paymentDetails: PaymentDetails;
  resourceDescription: string;
}

export const Http402PaymentModal: React.FC<Http402PaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentComplete,
  paymentDetails,
  resourceDescription,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'manual'>('wallet');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [txId, setTxId] = useState('');

  if (!isOpen) return null;

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const handleWalletPayment = async () => {
    setIsProcessing(true);
    try {
      // Get user's private key from local storage (in production, use proper wallet integration)
      const privateKeyWif = localStorage.getItem('bsv_private_key');
      if (!privateKeyWif) {
        toast.error('Please connect your BSV wallet first');
        return;
      }

      const privateKey = PrivateKey.fromWif(privateKeyWif);
      
      // Create payment transaction
      const tx = new Transaction();
      
      // Add output for payment
      tx.addOutput({
        lockingScript: P2PKH.lock(paymentDetails.address).toScript(),
        satoshis: paymentDetails.amount,
        change: false
      });

      // Add OP_RETURN with payment reference
      const refData = Buffer.from(paymentDetails.reference).toString('hex');
      tx.addOutput({
        lockingScript: Transaction.fromHex('0x6a' + refData).outputs[0].lockingScript,
        satoshis: 0,
        change: false
      });

      // Sign transaction
      await tx.fee();
      await tx.sign();

      // Broadcast transaction (simplified - in production use proper ARC client)
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/payment/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawTx: tx.toHex() })
      });

      const data = await response.json();
      const transactionId = data.txid;

      setTxId(transactionId);
      toast.success('Payment broadcast successfully!');

      // Verify payment with backend
      await verifyPayment(transactionId);

    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const verifyPayment = async (transactionId: string) => {
    try {
      // Poll for payment verification
      const maxAttempts = 10;
      let attempts = 0;

      const pollInterval = setInterval(async () => {
        attempts++;

        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/payment/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transaction_id: transactionId,
              payment_reference: paymentDetails.reference,
              amount: paymentDetails.amount
            })
          });

          const data = await response.json();

          if (data.verified) {
            clearInterval(pollInterval);
            toast.success('Payment verified!');
            onPaymentComplete(transactionId, data.access_token);
          }

          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            toast.error('Payment verification timeout. Please contact support.');
          }
        } catch (err) {
          console.error('Verification error:', err);
        }
      }, 2000);

    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Failed to verify payment');
    }
  };

  const handleManualPayment = async () => {
    if (!txId.trim()) {
      toast.error('Please enter a transaction ID');
      return;
    }

    setIsProcessing(true);
    try {
      await verifyPayment(txId);
    } catch (error) {
      toast.error('Failed to verify payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const bsvAmount = (paymentDetails.amount / 100000000).toFixed(8);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Payment Required</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-600">{resourceDescription}</p>
        </div>

        {/* Payment Amount */}
        <div className="p-6 bg-blue-50 border-b">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600">
              {bsvAmount} BSV
            </div>
            <div className="text-sm text-gray-600 mt-1">
              ≈ ${paymentDetails.amountUSD.toFixed(4)} USD
            </div>
          </div>
        </div>

        {/* Payment Method Tabs */}
        <div className="flex border-b">
          <button
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              paymentMethod === 'wallet'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setPaymentMethod('wallet')}
          >
            Pay with Wallet
          </button>
          <button
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              paymentMethod === 'manual'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setPaymentMethod('manual')}
          >
            Manual Payment
          </button>
        </div>

        {/* Payment Content */}
        <div className="p-6">
          {paymentMethod === 'wallet' ? (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
                <Info className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Quick Payment</p>
                  <p className="mt-1">
                    Pay instantly using your connected BSV wallet. Make sure you have sufficient funds.
                  </p>
                </div>
              </div>

              <button
                onClick={handleWalletPayment}
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Pay Now'
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* QR Code */}
              <div className="flex justify-center py-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <QRCodeSVG
                    value={`bitcoin:${paymentDetails.address}?amount=${bsvAmount}&label=T0kenRent&message=${paymentDetails.reference}`}
                    size={200}
                    level="H"
                  />
                </div>
              </div>

              {/* Payment Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Address
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={paymentDetails.address}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                  />
                  <button
                    onClick={() => handleCopy(paymentDetails.address, 'address')}
                    className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {copiedField === 'address' ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Payment Reference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Reference (include in transaction)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={paymentDetails.reference}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                  />
                  <button
                    onClick={() => handleCopy(paymentDetails.reference, 'reference')}
                    className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {copiedField === 'reference' ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Transaction ID Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  After payment, enter your transaction ID
                </label>
                <input
                  type="text"
                  value={txId}
                  onChange={(e) => setTxId(e.target.value)}
                  placeholder="Enter transaction ID..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handleManualPayment}
                disabled={isProcessing || !txId.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Payment'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-6 bg-gray-50 border-t text-sm text-gray-600">
          <p className="font-medium mb-2">What you'll unlock:</p>
          <ul className="space-y-1 ml-4">
            <li>• Exact pickup location with GPS coordinates</li>
            <li>• Access codes and instructions</li>
            <li>• Owner's direct contact information</li>
            <li>• Complete rental terms & conditions</li>
          </ul>
          <p className="mt-4 text-xs text-gray-500">
            This payment is non-refundable. Payment expires in {Math.floor(paymentDetails.expiresIn / 60)} minutes.
          </p>
        </div>
      </div>
    </div>
  );
};
