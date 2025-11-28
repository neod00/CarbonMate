import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center">
                <div className="mr-4 flex">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <Image
                            src="/images/carbonmate-logo.png"
                            alt="CarbonMate Logo"
                            width={32}
                            height={32}
                            className="h-8 w-8"
                        />
                        <div className="flex flex-col">
                            <span className="font-bold text-lg leading-tight">
                                CarbonMate
                            </span>
                            <span className="text-[10px] text-muted-foreground leading-tight">
                                by OpenBrain
                            </span>
                        </div>
                    </Link>
                    <nav className="flex items-center space-x-6 text-sm font-medium">
                        <Link
                            href="#how-it-works"
                            className="transition-colors hover:text-foreground/80 text-foreground/60"
                        >
                            How it Works
                        </Link>
                        <Link
                            href="#calculator"
                            className="transition-colors hover:text-foreground/80 text-foreground/60"
                        >
                            Calculator
                        </Link>
                        <Link
                            href="#faq"
                            className="transition-colors hover:text-foreground/80 text-foreground/60"
                        >
                            FAQ
                        </Link>
                    </nav>
                </div>
                <div className="flex flex-1 items-center justify-end space-x-2">
                    <a href="mailto:openbrain.carbonmate@gmail.com">
                        <Button variant="outline" size="sm">
                            Contact
                        </Button>
                    </a>
                </div>
            </div>
        </header>
    )
}
