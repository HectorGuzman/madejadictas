const REQUIRED_HEADER = "x-admin-key";

export const apiKeyGuard = (req, res, next) => {
  const configuredKey = process.env.ADMIN_API_KEY;
  if (!configuredKey) {
    return res
      .status(500)
      .json({ error: "ADMIN_API_KEY no está configurado en el entorno." });
  }

  const provided = req.header(REQUIRED_HEADER);
  if (!provided || provided !== configuredKey) {
    return res.status(401).json({
      error: "Acceso restringido al equipo madejadictas®.",
      detail: `Envía el header ${REQUIRED_HEADER}.`,
    });
  }

  next();
};
