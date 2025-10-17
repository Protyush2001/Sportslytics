import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import axios from "axios";

export default function PaymentForm({ role, onPaymentSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
//   const handlePayment = async () => {
//     const { data } = await axios.post(
//       "http://localhost:3018/api/payment/create-payment",
//       { role }
//     );
//     const clientSecret = data.clientSecret;
//     const result = await stripe.confirmPayment(clientSecret, {
//       payment_method: {
//         card: elements.getElement(CardElement),
//       },
//     });

//     if (result.paymentIntent.status === "succeeded") {
//       onPaymentSuccess();
//     } else {
//       alert("Payment failed");
//     }
//   };
  const handlePayment = async () => {
  if (!stripe || !elements) {
    alert("Stripe is not loaded yet. Please wait.");
    return;
  }

  const { data } = await axios.post(
    "http://localhost:3018/api/payment/create-payment",
    { role }
  );

  const clientSecret = data.clientSecret;

  const result = await stripe.confirmCardPayment(clientSecret, {
    payment_method: {
      card: elements.getElement(CardElement),
    },
  });

  if (result.error) {
    console.error("Stripe error:", result.error.message);
    alert("Payment failed: " + result.error.message);
    return;
  }

  if (result.paymentIntent && result.paymentIntent.status === "succeeded") {
    onPaymentSuccess();
  } else {
    alert("Payment was not successful.");
  }
};
  return <div>
    <CardElement/>
    <button onClick={handlePayment}>Pay & Register</button>
    </div>;
}