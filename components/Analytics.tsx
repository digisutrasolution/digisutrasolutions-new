import Script from "next/script";
import type { AnalyticsSettings } from "@/lib/analytics";
import { hasAnyTag } from "@/lib/analytics";

/**
 * Renders whichever measurement tags are configured — and nothing at all
 * when none are, so an unconfigured site makes zero third-party requests.
 *
 * Google tags boot with Consent Mode v2 denied. That is deliberate: the
 * tag still measures in a cookieless mode, and a consent banner can later
 * call gtag('consent','update',…) without any code change here.
 *
 * All tags use afterInteractive. beforeInteractive is invalid outside the
 * root layout in the App Router, and the consent default still executes
 * ahead of the gtag config that follows it in document order.
 */
export default function Analytics({ settings }: { settings: AnalyticsSettings }) {
  if (!hasAnyTag(settings)) return null;
  const { ga4Id, gtmId, metaPixelId, clarityId } = settings;
  const google = ga4Id || gtmId;

  return (
    <>
      {google && (
        <Script id="consent-default" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});`}
        </Script>
      )}

      {ga4Id && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`gtag('js',new Date());gtag('config','${ga4Id}');`}
          </Script>
        </>
      )}

      {gtmId && (
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f)})(window,document,'script','dataLayer','${gtmId}');`}
        </Script>
      )}

      {metaPixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`}
        </Script>
      )}

      {clarityId && (
        <Script id="clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","${clarityId}");`}
        </Script>
      )}
    </>
  );
}
