import { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext.tsx";
import Navbar from "../../components/Navbar.tsx";
import Footer from "../../components/Footer.tsx";
import Loader from "../../components/Loader.tsx";
import { CalendarIcon, SettingsIcon, MapPinIcon, PhoneIcon, MailIcon, MessageCircleIcon, ClockIcon } from "lucide-react";
import RestaurantWizard from "../../components/owner/RestaurantWizard.tsx";
import PendingApproval from "../../components/owner/PendingApproval.tsx";
import RequestRejected from "../../components/owner/RequestRejected.tsx";
import OwnerBookings from "../../components/owner/OwnerBookings.tsx";
import OwnerProfileDetails from "../../components/owner/OwnerProfileDetails.tsx";
import api from "../../lib/api.ts";
import toast from "react-hot-toast";

export default function OwnerDashboard() {
    const { logout } = useAppContext();
    const [restaurant, setRestaurant] = useState<any>(null);
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"bookings" | "details">("bookings");

    const fetchOwnerData = async () => {
        try {
            setLoading(true);
            const res = await api.get("/owner/restaurant");
            setRestaurant(res.data);
            if (res.data && res.data.status === "approved") {
                const bookingRes = await api.get("/owner/bookings");
                setBookings(bookingRes.data || []);
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || error?.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        (async () => await fetchOwnerData())();
    }, []);

    if (loading) {
        return <Loader text="Loading Owner Dashboard..." />;
    }

    return (
        <div className="min-h-screen bg-surface flex flex-col pt-20">
            <Navbar />

            <main className="grow max-w-7xl w-full mx-auto px-6 md:px-10 py-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant/10 pb-8 mb-8">
                    <div>
                        <h1 className="font-display text-2xl md:text-3xl text-primary">Restaurant Portal</h1>
                        <p className="text-xs text-black/55 mt-1.5">Manage your restaurant profile and reservations.</p>
                    </div>
                    <button onClick={logout}
                        className="bg-error-container hover:bg-error-container/85 text-error px-4 py-2 text-[10px] font-medium tracking-widest uppercase transition-colors">
                        Sign Out
                    </button>
                </div>

                {/* Case 1: No Restaurant */}
                {!restaurant ? (
                    <RestaurantWizard setRestaurant={setRestaurant} />
                ) : restaurant.status === "pending" ? (
                    <PendingApproval restaurant={restaurant} />
                ) : restaurant.status === "rejected" ? (
                    <RequestRejected restaurantName={restaurant.name} />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                        {/* Sidebar */}
                        <aside className="lg:col-span-3 space-y-4">
                            {/* Restaurant Info Card */}
                            <div className="bg-white border border-outline-variant/20 rounded-md shadow-sm overflow-hidden">
                                <div className="h-28 overflow-hidden">
                                    <img
                                        src={restaurant.image || "/default_restaurant_Img.jpeg"}
                                        alt={restaurant.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.currentTarget.src = "/default_restaurant_Img.jpeg"; }}
                                    />
                                </div>
                                <div className="p-4 space-y-3">
                                    <div>
                                        <h4 className="font-display font-semibold text-primary text-sm leading-tight">{restaurant.name}</h4>
                                        <span className="text-[9px] text-secondary tracking-widest uppercase bg-secondary/10 px-2 py-0.5 rounded-sm inline-block mt-1">
                                            APPROVED
                                        </span>
                                    </div>

                                    <div className="space-y-1.5 text-[10px] text-black/55">
                                        {restaurant.address && (
                                            <div className="flex items-start gap-1.5">
                                                <MapPinIcon size={11} className="text-secondary mt-0.5 shrink-0" />
                                                <span>{restaurant.address}</span>
                                            </div>
                                        )}
                                        {restaurant.phone && (
                                            <div className="flex items-center gap-1.5">
                                                <PhoneIcon size={11} className="text-secondary shrink-0" />
                                                <span>{restaurant.phone}</span>
                                            </div>
                                        )}
                                        {restaurant.email && (
                                            <div className="flex items-center gap-1.5">
                                                <MailIcon size={11} className="text-secondary shrink-0" />
                                                <span className="truncate">{restaurant.email}</span>
                                            </div>
                                        )}
                                        {restaurant.whatsapp && (
                                            <div className="flex items-center gap-1.5">
                                                <MessageCircleIcon size={11} className="text-[#25D366] shrink-0" />
                                                <span>{restaurant.whatsapp}</span>
                                            </div>
                                        )}
                                        {(restaurant.openingHours || restaurant.closingHours) && (
                                            <div className="flex items-center gap-1.5">
                                                <ClockIcon size={11} className="text-secondary shrink-0" />
                                                <span>{restaurant.openingHours || "17:00"} – {restaurant.closingHours || "23:00"}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Tab Nav */}
                            <div className="bg-white border border-outline-variant/20 p-4 rounded-md shadow-sm">
                                <nav className="flex flex-col gap-1.5">
                                    <button onClick={() => setActiveTab("bookings")}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-medium tracking-wider uppercase text-left rounded-sm cursor-pointer transition-colors ${
                                            activeTab === "bookings" ? "bg-primary text-white" : "text-black/55 hover:bg-surface"
                                        }`}>
                                        <CalendarIcon size={14} />
                                        Bookings ({bookings.length})
                                    </button>
                                    <button onClick={() => setActiveTab("details")}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-medium tracking-wider uppercase text-left rounded-sm cursor-pointer transition-colors ${
                                            activeTab === "details" ? "bg-primary text-white" : "text-black/55 hover:bg-surface"
                                        }`}>
                                        <SettingsIcon size={14} />
                                        Edit Profile
                                    </button>
                                </nav>
                            </div>
                        </aside>

                        {/* Content */}
                        <div className="lg:col-span-9 space-y-8">
                            {activeTab === "bookings" && (
                                <OwnerBookings bookings={bookings} setBookings={setBookings} totalSeats={restaurant.totalSeats} />
                            )}
                            {activeTab === "details" && (
                                <OwnerProfileDetails restaurant={restaurant} setRestaurant={setRestaurant} />
                            )}
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
