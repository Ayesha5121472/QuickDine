/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext.tsx";
import Navbar from "../components/Navbar.tsx";
import Footer from "../components/Footer.tsx";
import { ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import Loader from "../components/Loader.tsx";
import BookingSuccess from "../components/booking/BookingSuccess.tsx";
import BookingSummary from "../components/booking/BookingSummary.tsx";
import BookingForm from "../components/booking/BookingForm.tsx";
import api from "../lib/api.ts";

export default function BookingConfirmation() {
    const { slug } = useParams<{ slug: string }>();
    const [searchParams] = useSearchParams();
    const { user } = useAppContext();
    const navigate = useNavigate();

    const [restaurant, setRestaurant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [confirming, setConfirming] = useState(false);
    const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

    // Form inputs
    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [occasion, setOccasion] = useState("");
    const [specialRequests, setSpecialRequests] = useState("");

    // From Query Params
    const slot = searchParams.get("slot") || "";
    const date = searchParams.get("date") || "";
    const guests = searchParams.get("guests") || "2";

    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
            if (user.phone) setPhone(user.phone);
        }
    }, [user]);

    useEffect(() => {
        const fetchRestaurant = async () => {
           try{
            setLoading(true);
            setFetchError(null);
            const res = await api.get(`/restaurants/${slug}`);
            setRestaurant(res.data);
           } catch(error: any) {
            const msg = error?.response?.data?.message || error?.message || "Failed to load restaurant";
            setFetchError(msg);
            toast.error(msg);
           } finally {
            setLoading(false);
           }
        };

        if (slug) {
            fetchRestaurant();
        }
    }, [slug]);

    if (loading) {
        return <Loader text="Retrieving Dining Details..." />;
    }

    // Show error page instead of silently navigating away
    if (fetchError || !restaurant) {
        return (
            <div className="min-h-screen bg-surface flex flex-col pt-20">
                <Navbar />
                <main className="grow flex flex-col items-center justify-center py-24 px-6 text-center">
                    <div className="max-w-md space-y-6">
                        <h2 className="font-display text-3xl font-medium text-primary">Booking Unavailable</h2>
                        <p className="text-sm text-black/55 leading-relaxed">
                            {fetchError || "Could not load restaurant details. Please try again."}
                        </p>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => navigate(-1)}
                                className="bg-primary hover:bg-secondary text-white text-xs font-medium tracking-widest uppercase px-6 py-3 transition-colors"
                            >
                                Go Back
                            </button>
                            <Link
                                to="/search"
                                className="border border-outline-variant/50 hover:border-primary text-primary text-xs font-medium tracking-widest uppercase px-6 py-3 transition-colors"
                            >
                                Browse Restaurants
                            </Link>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const handleConfirmSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!slot || !date) {
            toast.error("Reservation details are missing. Please go back and select a time slot.");
            navigate(`/restaurant/${restaurant.slug || restaurant._id}`);
            return;
        }

        if (!restaurant._id) {
            toast.error("Restaurant information is missing. Please try again.");
            return;
        }

        try {
            setConfirming(true);
            const res = await api.post(`/bookings`, {
                restaurantId: restaurant._id,
                date,
                time: slot,
                guests: Number(guests) || 2,
                occasion: occasion || "",
                specialRequests: specialRequests || "",
            });
            setConfirmedBooking(res.data);
            toast.success("Reservation confirmed!");
        } catch (error: any) {
            const msg = error?.response?.data?.message || error?.message || "Failed to create reservation";
            toast.error(msg);
        } finally {
            setConfirming(false);
        }
    };

    // Render Success Screen
    if (confirmedBooking) {
        return (
            <div className="min-h-screen bg-surface flex flex-col pt-20">
                <Navbar />
                <main className="grow flex items-center justify-center py-12 px-6">
                    <BookingSuccess confirmedBooking={confirmedBooking} restaurant={restaurant} date={date} slot={slot} guests={guests} />
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface flex flex-col pt-20">
            <Navbar />

            {/* Main Booking Content */}
            <main className="grow max-w-7xl w-full mx-auto px-6 md:px-10 py-12">
                {/* Progress bar header */}
                <div className="flex items-center gap-2 mb-10 pb-4 border-b border-outline-variant/10 text-xs text-black/55">
                    <Link to={`/restaurant/${restaurant.slug || restaurant._id}`} className="hover:text-primary transition-colors">
                        {restaurant.name}
                    </Link>
                    <ChevronRight size={14} />
                    <span className="text-primary">Details & Confirmation</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    {/* Left Column (Reservation Summary) */}
                    <div className="lg:col-span-5">
                        <BookingSummary restaurant={restaurant} date={date} slot={slot} guests={guests} />
                    </div>

                    {/* Right Column (Guest Details Form) */}
                    <div className="lg:col-span-7">
                        <BookingForm
                            name={name}
                            setName={setName}
                            email={email}
                            setEmail={setEmail}
                            phone={phone}
                            setPhone={setPhone}
                            occasion={occasion}
                            setOccasion={setOccasion}
                            specialRequests={specialRequests}
                            setSpecialRequests={setSpecialRequests}
                            confirming={confirming}
                            onSubmit={handleConfirmSubmit}
                        />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
