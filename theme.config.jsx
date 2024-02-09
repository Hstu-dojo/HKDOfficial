export default {
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
      <strong>HKD</strong>
    </h4>
  ),
  footer: {
    text: <span>HKD {new Date().getFullYear()} © HSTU KARATE DOJO.</span>,
  },
  project: {
    link: "https://github.com/hasanshahriar32",
  },
  // ... other theme options
};
