export default {
  primaryHue: 260,
  primarySaturation: 84,
  logo: (
    <h4
      style={{
        display: "flex",
        flexDir: "row",
        justifyContent: "",
        alignItems: "center",
      }}
    >
      <img
        style={{ width: "20px", height: "20px", marginRight: "8px" }}
        src="/logo.png"
      />
      <strong>Kaizen</strong>
    </h4>
  ),
  footer: {
    text: <span>KKA {new Date().getFullYear()} © Kaizen Karate Academy.</span>,
  },
  project: {
    link: "https://github.com/hasanshahriar32",
  },
  // ... other theme options
};
