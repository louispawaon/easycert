import { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how Ditto collects, uses, and protects your data.',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">Privacy Policy</h1>
          
          <section className="mb-8">
            <p className="text-muted-foreground mb-4">Effective Date: August 1, 2026</p>
            <p className="text-muted-foreground">
              Ditto (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) values your privacy and is committed to protecting your personal data. 
              This Privacy Policy explains how we collect, use, and safeguard information when you use our web-based 
              platform for bulk design personalization.
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
                  <li>Ditto does not require you to create an account. Names, emails, or other details may appear only in content you choose to enter for output generation or if you contact us directly.</li>
                  <li>If you email us for support or questions, we receive the information you include in your message.</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">b. Uploaded Content:</h3>
                <p className="text-muted-foreground">
                  Design template images, record data, layout and text placement, font selections, and wizard progress are saved on your device using your browser&apos;s IndexedDB storage so the app can autosave your work and restore it when you return.
                  Output generation and downloads (such as images, PDFs, or ZIP archives) are processed in your browser; we do not upload those files or your project payloads to Ditto-operated servers for processing.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">c. Usage Data:</h3>
                <p className="text-muted-foreground">
                  When you load the site, our hosting provider may log technical information typical of web traffic (for example IP address, browser type, and request metadata). We also use Vercel Analytics to collect aggregated usage information to understand how the service is used.
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
                  <li>To provide output generation, local autosave, and export features in your browser.</li>
                  <li>To operate, maintain, and secure the website and hosting infrastructure.</li>
                  <li>To analyze aggregated usage and improve the product (including through Vercel Analytics).</li>
                  <li>To respond when you contact us by email.</li>
                  <li>To comply with law or protect rights and safety where applicable.</li>
                </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Data Sharing and Disclosure</h2>
            <p className="text-muted-foreground mb-4">
                We do not sell or rent your personal information. Ditto does not receive a copy of your project database from the app for processing on our servers. However, we may share information in the following cases:
            </p>
            <div className="space-y-4">
                <ul className="list-disc list-inside text-muted-foreground">
                  <li>With infrastructure and analytics providers that help us host and operate the site (for example Vercel for hosting and Vercel Analytics), subject to their terms and privacy notices.</li>
                  <li>When required by law, such as in response to legal requests or regulatory requirements.</li>
                  <li>In case of business transfers, such as mergers, acquisitions, or asset sales.</li>
                </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
            <p className="text-muted-foreground mb-4">
                Because your design template, record data, layout, and fonts stay on your device, its safety depends on your browser, device security, and who has access to your computer or browser profile. We serve the app over HTTPS in normal operation.
                No method of storage or transmission is completely secure; if someone can use your browser or device, they may be able to access locally stored project data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data Retention</h2>
            <p className="text-muted-foreground mb-4">
                Project data in IndexedDB remains on your device until you clear site data for Ditto, remove the underlying browser storage, or uninstall or reset your browser profile.
                Aggregated analytics and hosting logs may be retained by our providers according to their retention practices. For questions about this policy or requests related to information you sent us by email, contact us at miggypawaon@gmail.com.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Proof Links</h2>
            <p className="text-muted-foreground mb-4">
                When you add a proof link to your design, each output receives a unique,
                cryptographically signed link. The following metadata is transmitted to our server to generate that
                link:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mb-4">
              <li>The recipient name (derived from your record data)</li>
              <li>The issuing organization (if you entered one)</li>
              <li>A timestamp and a random identifier</li>
            </ul>
            <p className="text-muted-foreground mb-4">
                We do not store this metadata on our servers. The signed link is embedded in the proof link and
                becomes publicly readable by anyone who scans it. By using the proof link feature, you
                acknowledge that this information will be included in the signed link and may be visible to
                third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights and Choices</h2>
            <p className="text-muted-foreground mb-4">
                Depending on your location, you may have rights regarding your personal data, including:
            </p>
            <div className="space-y-4">
                <ul className="list-disc list-inside text-muted-foreground">
                  <li>Accessing, correcting, or deleting locally stored project data by using your browser&apos;s controls to clear site data or storage for this website.</li>
                  <li>Opting out of promotional communications (we do not operate marketing lists tied to a Ditto account today).</li>
                  <li>Restricting or objecting to certain processing, including consulting Vercel&apos;s documentation regarding analytics where applicable.</li>
                </ul>
            </div>
            <p className="text-muted-foreground mt-4">
                To exercise your rights or ask questions, contact us at miggypawaon@gmail.com.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Third-Party Links</h2>
            <p className="text-muted-foreground mb-4">
                Our platform may contain links to third-party websites. Analytics and hosting services (such as Vercel) have their own privacy policies governing data they process on our behalf or when you visit their sites.
                We encourage you to review those policies. We are not responsible for third-party privacy practices beyond what this policy describes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Changes to This Privacy Policy</h2>
            <p className="text-muted-foreground mb-4">
                We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated effective date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
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
