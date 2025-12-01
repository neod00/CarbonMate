"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6">
                <div className="flex items-center">
                    <Link href="/" className="flex items-center space-x-2">
                        <Image
                            src="/images/carbonmate-logo.png"
                            alt="CarbonMate Logo"
                            width={32}
                            height={32}
                            className="h-8 w-8"
                        />
                        <div className="flex flex-col">
                            <span className="font-bold text-base sm:text-lg leading-tight">
                                CarbonMate
                            </span>
                            <span className="text-[10px] text-muted-foreground leading-tight hidden sm:block">
                                by OpenBrain
                            </span>
                        </div>
                    </Link>
                    {/* 데스크톱 네비게이션 */}
                    <nav className="hidden md:flex items-center ml-6 lg:ml-8 space-x-4 lg:space-x-6 text-sm font-medium">
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
                
                {/* 데스크톱 Contact 버튼 */}
                <div className="hidden md:flex items-center space-x-2">
                    <a href="mailto:openbrain.carbonmate@gmail.com">
                        <Button variant="outline" size="sm">
                            Contact
                        </Button>
                    </a>
                </div>

                {/* 모바일 메뉴 버튼 */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-2 rounded-md text-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
                    aria-label="메뉴 열기"
                >
                    {mobileMenuOpen ? (
                        <X className="h-6 w-6" />
                    ) : (
                        <Menu className="h-6 w-6" />
                    )}
                </button>
            </div>

            {/* 모바일 메뉴 */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur">
                    <nav className="container px-4 py-4 space-y-3">
                        <Link
                            href="#how-it-works"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block py-2 text-base font-medium transition-colors hover:text-foreground/80 text-foreground/60"
                        >
                            How it Works
                        </Link>
                        <Link
                            href="#calculator"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block py-2 text-base font-medium transition-colors hover:text-foreground/80 text-foreground/60"
                        >
                            Calculator
                        </Link>
                        <Link
                            href="#faq"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block py-2 text-base font-medium transition-colors hover:text-foreground/80 text-foreground/60"
                        >
                            FAQ
                        </Link>
                        <div className="pt-2 border-t border-border/40">
                            <a href="mailto:openbrain.carbonmate@gmail.com">
                                <Button variant="outline" size="default" className="w-full">
                                    Contact
                                </Button>
                            </a>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    )
}
