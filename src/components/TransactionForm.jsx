import { useState, useMemo } from "react";

// --- Datos de ejemplo de categorías (luego esto puede venir de Firestore) ---
const CATEGORIAS_GASTO = ["comida", "transporte", "servicios", "entretenimiento", "otros"];
const CATEGORIAS_INGRESO = ["salario", "ventas", "otros"];

export default function TransactionForm() {
  // 1) ESTADO: cada "useState" es una variable que React "vigila".
  //    Cuando cambia, React vuelve a dibujar el componente.
  const [transacciones, setTransacciones] = useState([]);
  const [tipo, setTipo] = useState("gasto");
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS_GASTO[0]);
  const [descripcion, setDescripcion] = useState("");

  const categoriasDisponibles = tipo === "gasto" ? CATEGORIAS_GASTO : CATEGORIAS_INGRESO;

  // 2) MANEJO DEL FORMULARIO
  function handleSubmit(e) {
    e.preventDefault(); // evita que la página se recargue (comportamiento por defecto de un <form>)

    if (!monto || Number(monto) <= 0) return; // validación mínima

    const nuevaTransaccion = {
      id: crypto.randomUUID(), // en Firestore esto lo genera Firebase automáticamente
      tipo,
      monto: Number(monto),
      categoria,
      descripcion,
      fecha: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
      mes: new Date().toISOString().slice(0, 7), // YYYY-MM (útil para filtrar por mes en Firestore)
    };

    setTransacciones((prev) => [nuevaTransaccion, ...prev]);

    // limpiar formulario
    setMonto("");
    setDescripcion("");
  }

  // 3) CÁLCULOS DERIVADOS: no se guardan en estado, se recalculan solos
  //    "useMemo" evita recalcular en cada render si nada cambió (optimización)
  const resumen = useMemo(() => {
    const ingresos = transacciones
      .filter((t) => t.tipo === "ingreso")
      .reduce((suma, t) => suma + t.monto, 0);

    const gastos = transacciones
      .filter((t) => t.tipo === "gasto")
      .reduce((suma, t) => suma + t.monto, 0);

    return { ingresos, gastos, saldo: ingresos - gastos };
  }, [transacciones]);

  const gastosPorCategoria = useMemo(() => {
    const grupos = {};
    transacciones
      .filter((t) => t.tipo === "gasto")
      .forEach((t) => {
        grupos[t.categoria] = (grupos[t.categoria] || 0) + t.monto;
      });
    return Object.entries(grupos).sort((a, b) => b[1] - a[1]); // de mayor a menor
  }, [transacciones]);

  const formatoCOP = (n) =>
    n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

  return (
    <div className="max-w-md mx-auto p-6 space-y-6 font-sans">
      <h1 className="text-xl font-bold text-slate-800">Finanzas Personales</h1>

      {/* --- RESUMEN --- */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-xs text-green-700">Ingresos</p>
          <p className="font-semibold text-green-800">{formatoCOP(resumen.ingresos)}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3">
          <p className="text-xs text-red-700">Gastos</p>
          <p className="font-semibold text-red-800">{formatoCOP(resumen.gastos)}</p>
        </div>
        <div className={`rounded-lg p-3 ${resumen.saldo >= 0 ? "bg-blue-50" : "bg-orange-50"}`}>
          <p className="text-xs text-slate-600">Saldo</p>
          <p className={`font-semibold ${resumen.saldo >= 0 ? "text-blue-800" : "text-orange-800"}`}>
            {formatoCOP(resumen.saldo)}
          </p>
        </div>
      </div>

      {/* --- FORMULARIO --- */}
      <form onSubmit={handleSubmit} className="space-y-3 bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setTipo("gasto"); setCategoria(CATEGORIAS_GASTO[0]); }}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium ${tipo === "gasto" ? "bg-red-600 text-white" : "bg-slate-100 text-slate-600"}`}
          >
            Gasto
          </button>
          <button
            type="button"
            onClick={() => { setTipo("ingreso"); setCategoria(CATEGORIAS_INGRESO[0]); }}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium ${tipo === "ingreso" ? "bg-green-600 text-white" : "bg-slate-100 text-slate-600"}`}
          >
            Ingreso
          </button>
        </div>

        <input
          type="number"
          placeholder="Monto"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
        />

        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
        >
          {categoriasDisponibles.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Descripción (ej. almuerzo con cliente)"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
        />

        <button type="submit" className="w-full bg-slate-800 text-white rounded-md py-2 text-sm font-medium">
          Agregar
        </button>
      </form>

      {/* --- GASTOS POR CATEGORÍA --- */}
      {gastosPorCategoria.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-slate-700 mb-2">Gastos por categoría</p>
          <div className="space-y-1">
            {gastosPorCategoria.map(([cat, total]) => (
              <div key={cat} className="flex justify-between text-sm">
                <span className="capitalize text-slate-600">{cat}</span>
                <span className="font-medium text-slate-800">{formatoCOP(total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- LISTADO --- */}
      <div className="space-y-2">
        {transacciones.map((t) => (
          <div key={t.id} className="flex justify-between items-center bg-white border border-slate-200 rounded-md px-3 py-2 text-sm">
            <div>
              <p className="text-slate-700">{t.descripcion || t.categoria}</p>
              <p className="text-xs text-slate-400 capitalize">{t.categoria} · {t.fecha}</p>
            </div>
            <span className={t.tipo === "ingreso" ? "text-green-700 font-medium" : "text-red-700 font-medium"}>
              {t.tipo === "ingreso" ? "+" : "-"}{formatoCOP(t.monto)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
