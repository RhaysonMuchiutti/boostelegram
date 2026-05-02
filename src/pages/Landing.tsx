import { CampaignLandingPage } from "@/components/CampaignLandingPage";
import { useParams } from "react-router-dom";

const Landing = () => {
  const { slug } = useParams();
  
  // In a real app, we would fetch campaign data from Supabase using the slug
  // For now, we show the template
  return <CampaignLandingPage />;
};

export default Landing;
