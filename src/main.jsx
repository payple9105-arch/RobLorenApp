import React, {
  memo,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom/client";
import { supabase } from "./supabaseClient";
import "./index.css";
import StorePage from "./StorePage";
import ProductForm from "./ProductForm";

const PAYPAL_CLIENT_ID =
  "BAA_Ux_XQQKppjplmdc2V6jZZGOlSQATrlf2UKoc4Pi1lRIbKqtejqk2di8a9hRJ5e0xZFL46K_xfEYt-I";

// ... el resto del archivo completo con las tres partes integradas
