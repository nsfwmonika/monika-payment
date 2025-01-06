import '../styles/globals.css'
import '../styles/style.scss'
import '../styles/header.scss'
import Head from 'next/head'

interface MyAppProps {
  Component: React.ComponentType,
  pageProps: Record<string, any>
}

function MyApp({ Component, pageProps }: MyAppProps) {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID

  return (
    <>
      {/* Google Analytics */}
      {GA_ID && (
        <Head>
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', {
                  page_path: window.location.pathname,
                });
              `,
            }}
          />
        </Head>
      )}
      <Component {...pageProps} />
    </>
  )
}

export default MyApp