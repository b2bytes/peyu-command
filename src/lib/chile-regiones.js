// Regiones y comunas principales de Chile para validación de dirección.
// Lista completa de regiones (16) con comunas más comunes por región.
export const REGIONES_CHILE = [
  { codigo: 'XV', nombre: 'Arica y Parinacota', comunas: ['Arica', 'Camarones', 'General Lagos', 'Putre'] },
  { codigo: 'I', nombre: 'Tarapacá', comunas: ['Iquique', 'Alto Hospicio', 'Pozo Almonte', 'Pica', 'Huara', 'Camiña', 'Colchane'] },
  { codigo: 'II', nombre: 'Antofagasta', comunas: ['Antofagasta', 'Calama', 'Tocopilla', 'Mejillones', 'Taltal', 'San Pedro de Atacama', 'María Elena', 'Sierra Gorda', 'Ollagüe'] },
  { codigo: 'III', nombre: 'Atacama', comunas: ['Copiapó', 'Vallenar', 'Caldera', 'Chañaral', 'Diego de Almagro', 'Tierra Amarilla', 'Huasco', 'Freirina', 'Alto del Carmen'] },
  { codigo: 'IV', nombre: 'Coquimbo', comunas: ['La Serena', 'Coquimbo', 'Ovalle', 'Illapel', 'Salamanca', 'Vicuña', 'Andacollo', 'Combarbalá', 'Los Vilos', 'Monte Patria', 'Paihuano', 'Punitaqui', 'Río Hurtado', 'La Higuera', 'Canela'] },
  { codigo: 'V', nombre: 'Valparaíso', comunas: ['Valparaíso', 'Viña del Mar', 'Quilpué', 'Villa Alemana', 'Concón', 'San Antonio', 'Quillota', 'La Calera', 'Los Andes', 'San Felipe', 'La Ligua', 'Limache', 'Olmué', 'Casablanca', 'Cartagena', 'El Quisco', 'Algarrobo', 'El Tabo', 'Santo Domingo', 'Hijuelas', 'Nogales', 'La Cruz', 'Calle Larga', 'Rinconada', 'Putaendo', 'Santa María', 'Catemu', 'Llaillay', 'Panquehue', 'Petorca', 'Cabildo', 'Papudo', 'Zapallar', 'Juan Fernández', 'Isla de Pascua'] },
  { codigo: 'RM', nombre: 'Metropolitana', comunas: ['Santiago', 'Providencia', 'Las Condes', 'Vitacura', 'Lo Barnechea', 'Ñuñoa', 'La Reina', 'Macul', 'Peñalolén', 'La Florida', 'Puente Alto', 'San Miguel', 'San Joaquín', 'La Cisterna', 'El Bosque', 'La Granja', 'San Ramón', 'La Pintana', 'San Bernardo', 'Buin', 'Paine', 'Calera de Tango', 'Pirque', 'San José de Maipo', 'Maipú', 'Cerrillos', 'Estación Central', 'Pedro Aguirre Cerda', 'Lo Espejo', 'Quinta Normal', 'Lo Prado', 'Pudahuel', 'Cerro Navia', 'Renca', 'Quilicura', 'Conchalí', 'Independencia', 'Recoleta', 'Huechuraba', 'Colina', 'Lampa', 'Tiltil', 'Talagante', 'El Monte', 'Isla de Maipo', 'Padre Hurtado', 'Peñaflor', 'Melipilla', 'Alhué', 'Curacaví', 'María Pinto', 'San Pedro'] },
  { codigo: 'VI', nombre: "O'Higgins", comunas: ['Rancagua', 'Machalí', 'Graneros', 'San Fernando', 'Santa Cruz', 'Rengo', 'Requínoa', 'San Vicente', 'Chimbarongo', 'Codegua', 'Coínco', 'Coltauco', 'Doñihue', 'Las Cabras', 'Malloa', 'Mostazal', 'Olivar', 'Peumo', 'Pichidegua', 'Quinta de Tilcoco', 'Chépica', 'Lolol', 'Nancagua', 'Palmilla', 'Peralillo', 'Placilla', 'Pumanque', 'Pichilemu', 'La Estrella', 'Litueche', 'Marchihue', 'Navidad', 'Paredones'] },
  { codigo: 'VII', nombre: 'Maule', comunas: ['Talca', 'Curicó', 'Linares', 'Cauquenes', 'Constitución', 'Maule', 'San Clemente', 'Pelarco', 'Pencahue', 'Río Claro', 'San Rafael', 'Curepto', 'Empedrado', 'Hualañé', 'Licantén', 'Molina', 'Rauco', 'Romeral', 'Sagrada Familia', 'Teno', 'Vichuquén', 'Colbún', 'Longaví', 'Parral', 'Retiro', 'San Javier', 'Villa Alegre', 'Yerbas Buenas', 'Chanco', 'Pelluhue'] },
  { codigo: 'XVI', nombre: 'Ñuble', comunas: ['Chillán', 'Chillán Viejo', 'Bulnes', 'Quillón', 'San Ignacio', 'El Carmen', 'Pemuco', 'Pinto', 'San Carlos', 'Coihueco', 'Ñiquén', 'San Fabián', 'San Nicolás', 'Quirihue', 'Cobquecura', 'Coelemu', 'Ninhue', 'Portezuelo', 'Ránquil', 'Treguaco', 'Yungay'] },
  { codigo: 'VIII', nombre: 'Biobío', comunas: ['Concepción', 'Talcahuano', 'San Pedro de la Paz', 'Chiguayante', 'Hualpén', 'Penco', 'Tomé', 'Coronel', 'Lota', 'Hualqui', 'Florida', 'Santa Juana', 'Los Ángeles', 'Cabrero', 'Mulchén', 'Nacimiento', 'Negrete', 'Quilaco', 'Quilleco', 'San Rosendo', 'Santa Bárbara', 'Tucapel', 'Yumbel', 'Antuco', 'Alto Biobío', 'Laja', 'Lebu', 'Arauco', 'Cañete', 'Contulmo', 'Curanilahue', 'Los Álamos', 'Tirúa'] },
  { codigo: 'IX', nombre: 'La Araucanía', comunas: ['Temuco', 'Padre Las Casas', 'Villarrica', 'Pucón', 'Angol', 'Victoria', 'Lautaro', 'Nueva Imperial', 'Carahue', 'Pitrufquén', 'Loncoche', 'Curacautín', 'Collipulli', 'Cholchol', 'Cunco', 'Curarrehue', 'Freire', 'Galvarino', 'Gorbea', 'Lonquimay', 'Melipeuco', 'Perquenco', 'Saavedra', 'Teodoro Schmidt', 'Toltén', 'Vilcún', 'Ercilla', 'Lumaco', 'Los Sauces', 'Purén', 'Renaico', 'Traiguén'] },
  { codigo: 'XIV', nombre: 'Los Ríos', comunas: ['Valdivia', 'La Unión', 'Río Bueno', 'Lago Ranco', 'Futrono', 'Paillaco', 'Panguipulli', 'Los Lagos', 'Mariquina', 'Lanco', 'Máfil', 'Corral'] },
  { codigo: 'X', nombre: 'Los Lagos', comunas: ['Puerto Montt', 'Puerto Varas', 'Osorno', 'Castro', 'Ancud', 'Quellón', 'Calbuco', 'Frutillar', 'Llanquihue', 'Maullín', 'Cochamó', 'Fresia', 'Los Muermos', 'Hualaihué', 'Chaitén', 'Futaleufú', 'Palena', 'Chonchi', 'Curaco de Vélez', 'Dalcahue', 'Puqueldón', 'Queilén', 'Quemchi', 'Quinchao', 'Río Negro', 'Purranque', 'Puerto Octay', 'Puyehue', 'San Juan de la Costa', 'San Pablo'] },
  { codigo: 'XI', nombre: 'Aysén', comunas: ['Coyhaique', 'Aysén', 'Chile Chico', 'Cisnes', 'Cochrane', 'Guaitecas', 'Lago Verde', "O'Higgins", 'Río Ibáñez', 'Tortel'] },
  { codigo: 'XII', nombre: 'Magallanes', comunas: ['Punta Arenas', 'Puerto Natales', 'Porvenir', 'Cabo de Hornos', 'Antártica', 'Laguna Blanca', 'Río Verde', 'San Gregorio', 'Torres del Paine', 'Primavera', 'Timaukel'] },
];

export const getComunasByRegion = (regionNombre) => {
  const r = REGIONES_CHILE.find(x => x.nombre === regionNombre);
  return r ? r.comunas : [];
};

// Códigos postales chilenos: 7 dígitos numéricos.
export const validarCodigoPostal = (cp) => /^\d{7}$/.test(String(cp || '').trim());

// Teléfono chileno: +56 9 XXXX XXXX (acepta con/sin espacios y +56)
export const validarTelefonoChile = (tel) => {
  const limpio = String(tel || '').replace(/[\s\-()]/g, '');
  return /^(\+?56)?9\d{8}$/.test(limpio);
};

// Dirección: requiere al menos calle + número
export const validarDireccion = (dir) => {
  const t = String(dir || '').trim();
  if (t.length < 5) return false;
  return /\d/.test(t); // debe contener un número
};