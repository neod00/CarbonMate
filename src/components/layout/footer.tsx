export function Footer() {
    return (
        <footer className="border-t border-border/40 py-6 sm:py-8 px-4 sm:px-6 md:px-8">
            <div className="container max-w-7xl mx-auto flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row">
                <p className="text-balance text-center text-xs sm:text-sm leading-loose text-muted-foreground md:text-left">
                    Built for ISO 14067 PCF Calculation. The source code is available on{" "}
                    <a
                        href="#"
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium underline underline-offset-4 hover:text-foreground transition-colors"
                    >
                        GitHub
                    </a>
                    .
                </p>
            </div>
        </footer>
    )
}
