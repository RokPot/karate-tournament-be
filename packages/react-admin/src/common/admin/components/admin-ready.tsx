const styles = {
  root: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    fontFamily: '"Roboto", sans-serif',
  },
  main: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    flexDirection: 'column' as const,
    background: 'linear-gradient(135deg, #00023b 0%, #00023b 50%, #313264 100%)',
    color: 'white',
    fontSize: '1.5em',
    fontWeight: 'bold' as const,
  },
};

/**
 * Displayed when the user doesn't have the right permissions
 */
export default function Ready() {
  // const { adminAccount } = useContext(AdminContext);

  // todo, click here to refresh/signin again
  return (
    <div>
      <div style={styles.root}>
        <div style={styles.main}>Your account does not have any admin routes available</div>
      </div>
    </div>
  );
}
