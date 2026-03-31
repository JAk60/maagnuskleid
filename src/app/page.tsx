// No "use client" — this is now a server component
import HeroSection from "@/components/HeroSection"
import TrendCate from "@/components/Trending-categories"
import MensLatestFashion from "@/components/home/MensLatestFashion"
import WomensLatestFashion from "@/components/home/WomensLatestFashion"
import { getProducts } from "@/lib/supabase"
import { addSlugToProduct } from "@/utils/helpers"

export default async function Home() {
  const allProducts = await getProducts()
  const withSlugs = allProducts.map(addSlugToProduct)

  const trending = withSlugs
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4)

  const mens = withSlugs
    .filter(p => p.gender === "Male")
    .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
    .slice(0, 8)

  const womens = withSlugs
    .filter(p => p.gender === "Female")
    .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
    .slice(0, 8)

  return (
    <main className="w-full min-h-screen bg-[#E3D9C6]">
      <HeroSection />
      <TrendCate products={trending} />
      <MensLatestFashion products={mens} />
      <WomensLatestFashion products={womens} />
    </main>
  )
}