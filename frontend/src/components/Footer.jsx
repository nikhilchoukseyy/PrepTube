const contactLinks = [
  {
    label: "Instagram",
    href: "https://instagram.com/nikhilchoukseyy",
  },
  {
    label: "X.com",
    href: "https://x.com",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/nikhilchoukseyy",
  },
  {
    label: "Email",
    href: "mailto:nikhilranger18@gmail.com",
  },
];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/8 bg-black backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-2 text-sm text-white/55 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="font-semibold text-white/80">
            &copy;Copyright {year} PrepTube
          </p>
          <p>
            Developed by <span className="text-white">Nikhil Chouksey</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {contactLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith("mailto:") ? undefined : "_blank"}
              rel={link.href.startsWith("mailto:") ? undefined : "noreferrer"}
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 font-medium text-white/70 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
