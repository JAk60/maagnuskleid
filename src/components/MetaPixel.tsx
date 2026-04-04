// src/components/MetaPixel.tsx

'use client'

import Script from "next/script"
import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { fbq } from "@/lib/meta-pixel"

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

export default function MetaPixel() {
  const pathname = usePathname()

  useEffect(() => {
    if (!META_PIXEL_ID) return
    fbq('PageView')
  }, [pathname])

  if (!META_PIXEL_ID) return null

  return (
    <>
      <Script
        id="meta-pixel-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s){
              if(f.fbq)return;
              n=f.fbq=function(){
                n.callMethod ? n.callMethod.apply(n,arguments) : n.queue.push(arguments)
              };
              if(!f._fbq)f._fbq=n;
              n.push=n;
              n.loaded=!0;
              n.version='2.0';
              n.queue=[];
              t=b.createElement(e);
              t.async=!0;
              t.src=v;
              s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s);
            }(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');

            fbq('init', '${META_PIXEL_ID}', {}, { autoConfig: false });
          `,
        }}
      />

      <Script
        id="meta-pixel-purchase-guard"
        strategy="afterInteractive"
        src="https://connect.facebook.net/en_US/fbevents.js"
        onLoad={() => {
          // ✅ Wrap AFTER the real SDK is loaded — originalFbq is now the real function
          const originalFbq = window.fbq
          window.fbq = function(...args: Parameters<typeof originalFbq>) {
            if (args[0] === 'track' && args[1] === 'Purchase' && args.length <= 2) {
              console.warn('Blocked AUTO Purchase event', args)
              return
            }
            return originalFbq.apply(window, args)
          }
          // Copy over all properties the FB SDK set on the original
          Object.assign(window.fbq, originalFbq)
        }}
      />

      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}