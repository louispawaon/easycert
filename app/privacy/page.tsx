import { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'Privacy Policy - EasyCert',
  description: 'Learn how EasyCert collects, uses, and protects your data.',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">Privacy Policy</h1>
          
          <section className="mb-8">
            <p className="text-muted-foreground mb-4">Effective Date: March 03, 2025</p>
            <p className="text-muted-foreground">
              EasyCert (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) values your privacy and is committed to protecting your personal data. 
              This Privacy Policy explains how we collect, use, and safeguard information when you use our web-based 
              platform for automated certificate generation.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <p className="text-muted-foreground mb-4">
              We only collect the information necessary to provide our services:
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">a. Personal Information:</h3>
                <ul className="list-disc list-inside text-muted-foreground">
                  <li>Name, email address, and other contact details when you register an account</li>
                  <li>Billing details (if applicable) for payment processing</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">b. Uploaded Content:</h3>
                <p className="text-muted-foreground">
                  Certificate designs and attendee lists that you provide for certificate generation. 
                  However, we do not store or retain any uploaded images or names beyond the immediate 
                  processing required for certificate generation. Your data remains yours to keep.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">c. Usage Data:</h3>
                <p className="text-muted-foreground">
                  Log data such as IP address, browser type, device information, and usage patterns to improve our services.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-4">
                We use collected data for the following purposes:
            </p>
            <div className="space-y-4">
                <ul className="list-disc list-inside text-muted-foreground">
                  <li>To provide and improve our certificate generation services.</li>
                  <li>To process transactions and provide customer support.</li>
                  <li>To enhance security and prevent fraudulent activities.</li>
                  <li>To analyze usage trends and improve user experience.</li>
                  <li>To send service-related notifications and updates.</li>
                </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Data Sharing and Disclosure</h2>
            <p className="text-muted-foreground mb-4">
                We do not sell or rent your personal information. However, we may share information in the following cases:
            </p>
            <div className="space-y-4">
                <ul className="list-disc list-inside text-muted-foreground">
                  <li>With service providers who assist in hosting, payment processing, and customer support.</li>
                  <li>When required by law, such as in response to legal requests or regulatory requirements.</li>
                  <li>In case of business transfers, such as mergers, acquisitions, or asset sales.</li>
                </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
            <p className="text-muted-foreground mb-4">
                We do not store uploaded certificate designs or attendee lists beyond the immediate processing required for certificate generation. Other personal data is retained only as long as necessary for the purposes stated in this policy. You may request data deletion by contacting us at miggypawaon@gmail.com.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data Retention</h2>
            <p className="text-muted-foreground mb-4">
                We implement industry-standard security measures to protect your data from unauthorized access, disclosure, or alteration. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights and Choices</h2>
            <p className="text-muted-foreground mb-4">
                Depending on your location, you may have rights regarding your personal data, including:
            </p>
            <div className="space-y-4">
                <ul className="list-disc list-inside text-muted-foreground">
                  <li>Accessing, correcting, or deleting your information.</li>
                  <li>Opting out of promotional communications.</li>
                  <li>Restricting or objecting to data processing.</li>
                </ul>
            </div>
            <p className="text-muted-foreground mt-4">
                To exercise your rights, contact us at miggypawaon@gmail.com.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Third-Party Links</h2>
            <p className="text-muted-foreground mb-4">
                Our platform may contain links to third-party websites. We are not responsible for their privacy practices, and we encourage you to review their policies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Changes to This Privacy Policy</h2>
            <p className="text-muted-foreground mb-4">
                We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated effective date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy, please contact us at miggypawaon@gmail.com.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
} 