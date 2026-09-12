/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext.tsx";
import Navbar from "../components/Navbar.tsx";
import Footer from "../components/Footer.tsx";
import AuthModal from "../components/AuthModal.tsx";
import toast from "react-hot-toast";
import Loader from "../components/Loader.tsx";
import RestaurantHero from "../components/restaurant/RestaurantHero.tsx";
import RestaurantInfo from "../components/restaurant/RestaurantInfo.tsx";
import RestaurantReviews from "../components/restaurant/RestaurantReviews.tsx";
import BookingWidget from "../components/restaurant/BookingWidget.tsx";
import api from "../lib/api.ts";

export default function RestaurantDetail() {
    const { slug } = useParams<{ slug: string }>();
    const { isAuthenticated, setAuthModalOpen } = useAppContext();
    const navigate = useNavigate();

    const [restaurant, setRestaurant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Booking Widget states
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedGuests, setSelectedGuests] = useState("2");
    const [selectedSlot, setSelectedSlot] = useState("");
    const [slotsAvailability, setSlotsAvailability] = useState<any[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    useEffect(() => {
        const fetchRestaurant = async () => {
           try{
            setLoading(true);
            setFetchError(null);
            const res = await api.get(`/restaurants/${slug}`);
            setRestaurant(res.data);
            // Use local date (not UTC) to avoid timezone issues causing "past date" errors
            const now = new Date();
            const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
            setSelectedDate(localToday);
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

    useEffect(() => {
        const fetchAvailability = async () => {
           if(!restaurant?._id || !selectedDate) return;
           try{
            setLoadingSlots(true);
            const res = await api.get(`/restaurants/${restaurant._id}/availability?date=${selectedDate}`);
            setSlotsAvailability(res.data);
           }catch(error:any){
            console.error("Availability error:", error);
           }finally{
                setLoadingSlots(false);
           }
           
        };
        fetchAvailability();
    }, [restaurant?._id, selectedDate]);

    if (loading) {
        return <Loader text="Loading Restaurant Details..." />;
    }

    // Show a proper error page instead of silently navigating to home
    if (fetchError || !restaurant) {
        return (
            <div className="min-h-screen bg-surface flex flex-col pt-20">
                <Navbar />
                <AuthModal />
                <main className="grow flex flex-col items-center justify-center py-24 px-6 text-center">
                    <div className="max-w-md space-y-6">
                        <h2 className="font-display text-3xl font-medium text-primary">Restaurant Not Found</h2>
                        <p className="text-sm text-black/55 leading-relaxed">
                            {fetchError && fetchError !== "Restaurant not found"
                                ? fetchError
                                : "This restaurant could not be found. It may have been removed or is pending approval."}
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Link
                                to="/search"
                                className="bg-primary hover:bg-secondary text-white text-xs font-medium tracking-widest uppercase px-6 py-3 transition-colors"
                            >
                                Browse Restaurants
                            </Link>
                            <Link
                                to="/"
                                className="border border-outline-variant/50 hover:border-primary text-primary text-xs font-medium tracking-widest uppercase px-6 py-3 transition-colors"
                            >
                                Go Home
                            </Link>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const handleReserveClick = () => {
        if (!selectedSlot) {
            toast.error("Please select a dining time slot.");
            return;
        }

        if (!isAuthenticated) {
            setAuthModalOpen(true);
            return;
        }

        // Redirect to confirmation page with query params
        const target = restaurant.slug || restaurant._id;
        navigate(`/booking/${target}?slot=${selectedSlot}&date=${selectedDate}&guests=${selectedGuests}`);
    };

    return (
        <div className="min-h-screen bg-surface flex flex-col pt-20">
            <Navbar />
            <AuthModal />

            {/* Hero Image Section */}
            <RestaurantHero restaurant={restaurant} />

            {/* Split Content Section */}
            <main className="grow max-w-7xl w-full mx-auto px-6 md:px-10 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Left Column (Details, Menu, Reviews) */}
                    <div className="lg:col-span-8 space-y-12">
                        <RestaurantInfo restaurant={restaurant} />
                        <RestaurantReviews />
                    </div>

                    {/* Right Column (Sticky Reservation Widget) */}
                    <div className="lg:col-span-4 lg:sticky lg:top-36">
                        <BookingWidget
                            restaurant={restaurant}
                            selectedDate={selectedDate}
                            setSelectedDate={setSelectedDate}
                            selectedGuests={selectedGuests}
                            setSelectedGuests={setSelectedGuests}
                            selectedSlot={selectedSlot}
                            setSelectedSlot={setSelectedSlot}
                            slotsAvailability={slotsAvailability}
                            loadingSlots={loadingSlots}
                            isAuthenticated={isAuthenticated}
                            handleReserveClick={handleReserveClick}
                        />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
