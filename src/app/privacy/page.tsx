export default function PrivacyPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Privacy Policy</h1>
      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
        <p>
          <strong>Last updated:</strong> March 2026
        </p>

        <h2>1. Overview</h2>
        <p>
          DeckTrader (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates
          a platform for trading Magic: The Gathering decks. This privacy policy
          explains how we collect, use, and protect your personal information in
          accordance with Canada&apos;s Personal Information Protection and
          Electronic Documents Act (PIPEDA).
        </p>

        <h2>2. Information We Collect</h2>
        <ul>
          <li>
            <strong>Account information:</strong> email address, username, city,
            and province
          </li>
          <li>
            <strong>Profile information:</strong> bio, avatar (optional)
          </li>
          <li>
            <strong>Deck information:</strong> deck names, card lists, photos,
            and estimated values
          </li>
          <li>
            <strong>Trade information:</strong> trade proposals, messages, and
            completion status
          </li>
        </ul>

        <h2>3. How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul>
          <li>Provide and maintain the DeckTrader platform</li>
          <li>Facilitate trades between users</li>
          <li>Display public profiles and deck listings</li>
          <li>Send trade-related notifications (with your consent)</li>
        </ul>

        <h2>4. Information Sharing</h2>
        <p>
          Your public profile (username, city, province, bio, trade history) is
          visible to all users. Your email address is only shared with a trade
          partner after both parties accept a trade.
        </p>
        <p>We do not sell your personal information to third parties.</p>

        <h2>5. Data Storage</h2>
        <p>
          Your data is stored securely using Supabase infrastructure. We use
          industry-standard security measures to protect your information.
        </p>

        <h2>6. Your Rights</h2>
        <p>Under PIPEDA, you have the right to:</p>
        <ul>
          <li>Access your personal information</li>
          <li>Request correction of inaccurate information</li>
          <li>Withdraw consent for data processing</li>
          <li>Request deletion of your account and data</li>
        </ul>

        <h2>7. Contact</h2>
        <p>For privacy inquiries, please contact us through the platform.</p>
      </div>
    </main>
  )
}
