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
                <div className="footer-disclaimer">
                    This site does not store any files on our server, we only linked to the media which is hosted on 3rd party services.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
