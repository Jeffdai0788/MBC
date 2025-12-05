import type { AppProps } from "next/app";
import dynamic from "next/dynamic";
import "../styles/globals.css";

const WalletProviderWrapper = dynamic(
    () => import("../components/WalletProviderWrapper"),
    { ssr: false }
);

const Layout = dynamic(
    () => import("../components/Layout"),
    { ssr: false }
);

const TransactionExplorer = dynamic(
    () => import("../components/TransactionExplorer"),
    { ssr: false }
);

export default function App({ Component, pageProps }: AppProps) {
    return (
        <WalletProviderWrapper>
            <Layout>
                <Component {...pageProps} />
            </Layout>
            <TransactionExplorer />
        </WalletProviderWrapper>
    );
}
