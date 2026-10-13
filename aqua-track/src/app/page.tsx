
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { AUTH_LOGIN_PATH, AUTH_SIGNUP_PATH, getRoleHomePath } from "@/lib/auth/routes";
import type { DemoRoleKey } from "@/config/demo-credentials";

const features = [
  {
    number: "01",
    title: "Smart QR Tracking",
    description:
      "Give every laundry bag a unique identity and track its journey through QR scanning.",
    icon: "⌗",
  },
  {
    number: "02",
    title: "Real-Time Progress",
    description:
      "Follow every stage, from collection and washing to dispatch and final delivery.",
    icon: "◷",
  },
  {
    number: "03",
    title: "Connected Teams",
    description:
      "Give students, delivery staff, washing staff and administrators their own workflows.",
    icon: "◎",
  },
];

const workflow = [
  { number: "01", title: "Collection", detail: "Bags collected and identified" },
  { number: "02", title: "Processing", detail: "Received and sent for washing" },
  { number: "03", title: "Ready", detail: "Laundry prepared for dispatch" },
  { number: "04", title: "Delivery", detail: "Returned to its owner" },
];

const demoRoles = [
  {
    title: "Student",
    description: "Track laundry and view its status.",
    symbol: "01",
    role: "student",
  },
  {
    title: "Delivery Staff",
    description: "Manage collection and delivery.",
    symbol: "02",
    role: "delivery",
  },
  {
    title: "Washing Staff",
    description: "Update washing and processing stages.",
    symbol: "03",
    role: "washing",
  },
  {
    title: "Administrator",
    description: "Oversee operations and system activity.",
    symbol: "04",
    role: "admin",
  },
] satisfies {
  title: string;
  description: string;
  symbol: string;
  role: DemoRoleKey;
}[];

export default async function HomePage() {
  const profile = await getCurrentProfile();
  const dashboardPath =
    profile?.is_active ? getRoleHomePath(profile.role) : null;

  return (
    <main className="aqua-landing">
      <nav className="aqua-nav">
        <Link href="/" className="aqua-brand">
          <span className="aqua-brand-icon">A</span>
          <span>
            <strong>AQUA TRACK</strong>
            <small>SMART LAUNDRY MANAGEMENT</small>
          </span>
        </Link>

        <div className="aqua-nav-links">
          <a href="#features">Features</a>
          <a href="#workflow">How it works</a>
          <a href="#demo">Demo access</a>
        </div>

        <div className="aqua-nav-actions">
          {dashboardPath ? (
            <Link href={dashboardPath} className="aqua-button aqua-button-primary">
              Go to Dashboard ↗
            </Link>
          ) : (
            <>
              <Link href={AUTH_LOGIN_PATH} className="aqua-signin">
                Sign in
              </Link>
              <Link href={AUTH_SIGNUP_PATH} className="aqua-button aqua-button-primary">
                Get Started ↗
              </Link>
            </>
          )}
        </div>
      </nav>

      <section className="aqua-hero">
        <div className="aqua-orb aqua-orb-one" />
        <div className="aqua-orb aqua-orb-two" />

        <div className="aqua-hero-content">
          <div className="aqua-eyebrow">
            <span className="aqua-live-dot" />
            INTELLIGENT LAUNDRY TRACKING
          </div>

          <h1>
            Every garment.
            <br />
            Every stage.
            <br />
            <span>One smart track.</span>
          </h1>

          <p className="aqua-hero-description">
            A smarter way to manage laundry. From QR-powered collection to
            washing and delivery, follow every step with confidence.
          </p>

          <div className="aqua-hero-actions">
            {dashboardPath ? (
              <Link href={dashboardPath} className="aqua-button aqua-button-primary">
                Open Dashboard <span>↗</span>
              </Link>
            ) : (
              <>
                <Link href={AUTH_SIGNUP_PATH} className="aqua-button aqua-button-primary">
                  Get Started <span>↗</span>
                </Link>
                <Link href={AUTH_LOGIN_PATH} className="aqua-button aqua-button-secondary">
                  Sign in to Aqua Track
                </Link>
              </>
            )}
          </div>

          <div className="aqua-trust-note">
            <span>✳</span> Track smarter. Work seamlessly. Deliver on time.
          </div>
        </div>

        <div className="aqua-visual" aria-label="Illustration of laundry tracking">
          <div className="aqua-ring aqua-ring-outer" />
          <div className="aqua-ring aqua-ring-inner" />

          <div className="aqua-center-mark">
            <span className="aqua-center-symbol">≈</span>
            <strong>AQUA</strong>
            <small>TRACK EVERY STEP</small>
          </div>

          <div className="aqua-float-card aqua-float-top">
            <span className="aqua-card-icon">⌗</span>
            <span>
              <small>IDENTIFICATION</small>
              <strong>QR scan ready</strong>
            </span>
            <span className="aqua-card-check">✓</span>
          </div>

          <div className="aqua-float-card aqua-float-bottom">
            <span className="aqua-status-pulse" />
            <span>
              <small>LAUNDRY STATUS</small>
              <strong>Track every stage</strong>
            </span>
            <span className="aqua-card-arrow">↗</span>
          </div>

          <div className="aqua-mini-label">COLLECT · WASH · DELIVER</div>
        </div>

        <div className="aqua-hero-bottom">
          <span>BUILT FOR A BETTER LAUNDRY EXPERIENCE</span>
          <a href="#features">DISCOVER THE PLATFORM ↓</a>
        </div>
      </section>

      <section className="aqua-section" id="features">
        <div className="aqua-section-heading">
          <div className="aqua-eyebrow">THE AQUA TRACK ADVANTAGE</div>
          <h2>
            Laundry management,
            <br />
            <span>without the guesswork.</span>
          </h2>
          <p>
            One connected platform to make laundry operations easier to
            manage, track and understand.
          </p>
        </div>

        <div className="aqua-feature-grid">
          {features.map((feature) => (
            <article className="aqua-feature-card" key={feature.number}>
              <div className="aqua-feature-top">
                <span className="aqua-feature-icon">{feature.icon}</span>
                <span className="aqua-feature-number">{feature.number}</span>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <span className="aqua-feature-line" />
            </article>
          ))}
        </div>
      </section>

      <section className="aqua-workflow-section" id="workflow">
        <div className="aqua-section-heading">
          <div className="aqua-eyebrow">A CLEARER JOURNEY</div>
          <h2>
            From pickup to
            <br />
            <span>perfectly delivered.</span>
          </h2>
          <p>
            Every stage follows a defined workflow, making laundry progress
            easier to follow for everyone involved.
          </p>
        </div>

        <div className="aqua-timeline">
          {workflow.map((stage, index) => (
            <article className="aqua-timeline-card" key={stage.number}>
              <div className="aqua-timeline-number">{stage.number}</div>
              <div className="aqua-timeline-connector">
                <span />
                {index < workflow.length - 1 && <i />}
              </div>
              <div>
                <h3>{stage.title}</h3>
                <p>{stage.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="aqua-demo-section" id="demo">
        <div className="aqua-demo-heading">
          <div>
            <div className="aqua-eyebrow">EXPLORE THE PLATFORM</div>
            <h2>
              One system.
              <br />
              <span>Four perspectives.</span>
            </h2>
            <p>
              Explore how each role contributes to the complete laundry
              management workflow.
            </p>
          </div>

          <div className="aqua-demo-badge">
            <span className="aqua-live-dot" />
            LIVE SYSTEM DEMO
          </div>
        </div>

        <div className="aqua-demo-grid">
          {demoRoles.map((role) => (
            <article className="aqua-demo-card" key={role.title}>
              <span className="aqua-demo-number">{role.symbol}</span>
              <h3>{role.title}</h3>
              <p>{role.description}</p>
              <Link
                href={{
                  pathname: AUTH_LOGIN_PATH,
                  query: { role: role.role },
                }}
                className="aqua-demo-link"
              >
                Sign in as this role <span>↗</span>
              </Link>
            </article>
          ))}
        </div>

        <div className="aqua-credentials-note">
          <span>ⓘ</span>
          <p>
            Select a role to prefill its demo credentials on the login page.
            Click Login to continue.
          </p>
        </div>
      </section>

      <footer className="aqua-footer">
        <Link href="/" className="aqua-brand">
          <span className="aqua-brand-icon">A</span>
          <span>
            <strong>AQUA TRACK</strong>
            <small>SMART LAUNDRY MANAGEMENT</small>
          </span>
        </Link>
        <p>Smarter tracking. Smoother operations.</p>
        <span>© {new Date().getFullYear()} Aqua Track</span>
      </footer>
    </main>
  );
}
