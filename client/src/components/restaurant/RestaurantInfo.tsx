/* eslint-disable @typescript-eslint/no-explicit-any */
import { MapPin, Clock, Utensils, ChefHat, Phone, Mail, MessageCircle } from "lucide-react";

interface RestaurantInfoProps {
    restaurant: any;
}

/** Convert Pakistani/international phone numbers to WhatsApp-compatible format */
function buildWhatsAppNumber(raw: string): string {
    // Remove all spaces, dashes, brackets, dots
    let num = raw.replace(/[\s\-().+]/g, "");

    // Already has country code 92
    if (num.startsWith("92")) return num;

    // Starts with 0 (Pakistan local format: 03XXXXXXXXX)
    if (num.startsWith("0")) return "92" + num.slice(1);

    // Fallback: assume Pakistan
    return "92" + num;
}

export default function RestaurantInfo({ restaurant }: RestaurantInfoProps) {
    if (!restaurant) return null;

    const hasWhatsApp = Boolean(restaurant.whatsapp?.trim());
    const whatsappNumber = hasWhatsApp ? buildWhatsAppNumber(restaurant.whatsapp) : "";
    const whatsappMessage = encodeURIComponent("Hello, I would like to know more about your restaurant.");
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

    const openingTime = restaurant.openingHours || "17:00";
    const closingTime = restaurant.closingHours || "23:00";
    const availableDays = restaurant.availableDays || "Mon – Sun";

    // Format time from 24h to 12h for display
    const fmt = (t: string) => {
        const [h, m] = t.split(":").map(Number);
        const suffix = h >= 12 ? "PM" : "AM";
        const hour = h % 12 || 12;
        return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
    };

    return (
        <div className="space-y-12 text-left">
            {/* Info Ribbon */}
            <div className="grid grid-cols-3 gap-4 py-6 border-y border-outline-variant/10">
                <div className="text-center border-r border-outline-variant/10 px-2">
                    <ChefHat className="text-secondary mx-auto mb-2" size={20} />
                    <span className="block text-[9px] tracking-wider text-black/55 uppercase">CHEF</span>
                    <span className="text-xs text-primary mt-1 block">{restaurant.chef}</span>
                </div>
                <div className="text-center border-r border-outline-variant/10 px-2">
                    <Utensils className="text-secondary mx-auto mb-2" size={20} />
                    <span className="block text-[9px] tracking-wider text-black/55 uppercase">CUISINE</span>
                    <span className="text-xs text-primary mt-1 block">{restaurant.cuisine}</span>
                </div>
                <div className="text-center px-2">
                    <Clock className="text-secondary mx-auto mb-2" size={20} />
                    <span className="block text-[9px] tracking-wider text-black/55 uppercase">HOURS</span>
                    <span className="text-xs text-primary mt-1 block">{fmt(openingTime)} – {fmt(closingTime)}</span>
                </div>
            </div>

            {/* About Section */}
            <section className="space-y-4">
                <h3 className="font-display text-xl font-semibold text-primary">About the Dining Room</h3>
                <p className="text-sm text-black/55 leading-relaxed">{restaurant.description}</p>

                <div className="flex flex-col gap-2 pt-2">
                    <div className="flex items-start gap-2 text-sm text-black/55">
                        <MapPin size={16} className="text-secondary shrink-0 mt-0.5" />
                        <span>{restaurant.address}</span>
                    </div>

                    {availableDays && (
                        <div className="flex items-center gap-2 text-sm text-black/55">
                            <Clock size={16} className="text-secondary shrink-0" />
                            <span>{availableDays} &nbsp;·&nbsp; {fmt(openingTime)} – {fmt(closingTime)}</span>
                        </div>
                    )}

                    {restaurant.phone?.trim() && (
                        <div className="flex items-center gap-2 text-sm text-black/55">
                            <Phone size={16} className="text-secondary shrink-0" />
                            <a href={`tel:${restaurant.phone}`} className="hover:text-primary transition-colors">
                                {restaurant.phone}
                            </a>
                        </div>
                    )}

                    {restaurant.email?.trim() && (
                        <div className="flex items-center gap-2 text-sm text-black/55">
                            <Mail size={16} className="text-secondary shrink-0" />
                            <a href={`mailto:${restaurant.email}`} className="hover:text-primary transition-colors">
                                {restaurant.email}
                            </a>
                        </div>
                    )}
                </div>

                {/* Tags */}
                {restaurant.tags && restaurant.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                        {restaurant.tags.map((tag: string) => (
                            <span key={tag} className="text-[10px] font-medium tracking-wider text-secondary border border-secondary/30 bg-secondary/5 px-2.5 py-1 rounded-sm uppercase">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </section>

            {/* WhatsApp Button */}
            {hasWhatsApp ? (
                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs font-medium tracking-wider uppercase px-5 py-3 rounded-sm transition-colors"
                >
                    <MessageCircle size={16} />
                    Contact on WhatsApp
                </a>
            ) : null}
        </div>
    );
}
