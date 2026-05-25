import "./footer.css";
import { Compass } from "lucide-react";

const Footer = () => {
    return (
        <footer className="footer">
            <div className="inside-footer-block">
                <div className="footer-orbit">
                    <Compass size={20} />
                    Curated by EpicStream
                </div>
            </div>
        </footer>
    );
};

export default Footer;
