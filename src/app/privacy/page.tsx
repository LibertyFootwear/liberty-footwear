export const metadata = {
  title: "Privacy Policy – Liberty Footwear",
  description: "How Liberty Footwear collects, uses and protects your personal information.",
};

const LAST_UPDATED = "July 1, 2026";

export default function PrivacyPage() {
  return (
    <div className="bg-white min-h-screen">
      <section className="bg-navy text-white py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-black mb-2">Privacy Policy</h1>
          <p className="text-white/60 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-10 text-gray-700 leading-relaxed text-sm">

          <div>
            <h2 className="text-xl font-black text-navy mb-3 pb-2 border-b border-gray-100">Summary</h2>
            <p>
              Because your privacy is very important to us, Liberty Footwear Inc. wants to build users'
              trust and confidence in our company and demonstrate our commitment to privacy by disclosing
              our privacy practices. As part of the normal operation of our website and business, we may
              collect certain information about you. This Privacy Policy describes what information we
              collect, how we use it, and how we protect it.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-black text-navy mb-3 pb-2 border-b border-gray-100">Information We Collect</h2>
            <p className="mb-3">
              We do <strong>not</strong> sell, rent, distribute or provide your personal or corporate
              information to third parties. We may collect the following types of information:
            </p>
            <ul className="space-y-2">
              {[
                "Your name, email address, phone number and shipping/billing address when you place an order or create an account.",
                "The domain name and email address (where possible) of visitors to our website.",
                "Email addresses of those who communicate with us via email or contact forms.",
                "Aggregate information on what pages consumers access or visit.",
                "Information volunteered by the consumer, such as survey responses, account registrations or newsletter sign-ups.",
                "Order history and purchase details necessary to fulfill your orders and provide customer support.",
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-red font-bold mt-0.5 flex-shrink-0">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              The information we collect is used to process your orders, improve the content of our
              website, notify consumers about updates, and provide customer support.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-black text-navy mb-3 pb-2 border-b border-gray-100">How We Use Your Information</h2>
            <ul className="space-y-2">
              {[
                "To process and fulfill your orders, including shipping and payment.",
                "To communicate with you about your orders, account or inquiries.",
                "To send newsletters or promotional emails — only if you have opted in. You may unsubscribe at any time.",
                "To improve our website, products and customer experience.",
                "To comply with legal obligations.",
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-red font-bold mt-0.5 flex-shrink-0">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-black text-navy mb-3 pb-2 border-b border-gray-100">Cookies</h2>
            <p className="mb-3">
              We use cookies to record user-specific information on what pages users access or visit,
              and to customize web page content based on visitors' browser type or other information
              the visitor sends. We only use cookies to provide you with the most personalized
              experience we can offer.
            </p>
            <p>
              You can manage cookies through your web browser settings. Most browsers have options for
              notifying you when you are about to encounter a cookie or for disabling cookies entirely.
              Please note that disabling cookies may affect the functionality of certain features on
              our website, such as the shopping cart.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-black text-navy mb-3 pb-2 border-b border-gray-100">Payment Security</h2>
            <p>
              All payments on our website are processed securely through <strong>Stripe</strong>, a
              PCI-DSS compliant payment processor. Liberty Footwear Inc. does not store your full
              credit card details on our servers. Stripe's privacy policy governs the handling of
              your payment information.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-black text-navy mb-3 pb-2 border-b border-gray-100">Third Parties</h2>
            <p className="mb-3">
              This policy only addresses the use and disclosure of information by Liberty Footwear Inc.
              We do not control the privacy policies of any third parties. If you choose to disclose
              information to other parties, we recommend that you ask them about their privacy policies
              prior to disclosure.
            </p>
            <p>
              We may share your information with trusted third-party service providers (such as shipping
              carriers and payment processors) solely for the purpose of fulfilling your order. These
              parties are contractually obligated to keep your information confidential.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-black text-navy mb-3 pb-2 border-b border-gray-100">Security</h2>
            <p>
              Liberty Footwear Inc. uses industry-standard efforts to safeguard the confidentiality of
              your personal information, including encryption (HTTPS), firewalls and user authentication.
              While we take reasonable precautions to protect your data, no method of transmission over
              the Internet is 100% secure. We encourage you to use a strong, unique password for your
              account and to keep it confidential.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-black text-navy mb-3 pb-2 border-b border-gray-100">Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="space-y-2">
              {[
                "Access the personal information we hold about you.",
                "Request correction of inaccurate information.",
                "Request deletion of your account and associated data.",
                "Opt out of marketing communications at any time.",
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-red font-bold mt-0.5 flex-shrink-0">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3">
              To exercise any of these rights, please{" "}
              <a href="/contact" className="text-navy font-medium hover:underline">contact us</a>.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-black text-navy mb-3 pb-2 border-b border-gray-100">Updates to This Policy</h2>
            <p>
              We may update or amend this Privacy Policy at any time by posting the revised policy to
              the Liberty Footwear Inc. website. We encourage you to review this policy from time to
              time. Continued use of our website after any changes constitutes your acceptance of the
              updated policy.
            </p>
          </div>

          <div className="border-t border-gray-100 pt-8">
            <p className="text-xs text-gray-400">
              Questions about this policy? {" "}
              <a href="/contact" className="text-navy hover:underline font-medium">Contact us</a>{" "}
              or call{" "}
              <a href="tel:6169303060" className="text-navy hover:underline font-medium">616.930.3060</a>.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
