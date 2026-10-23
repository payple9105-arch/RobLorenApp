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
import PlansPage from "./PlansPage";
import CommissionsPage from "./CommissionsPage";
import ProductDetailPage from "./ProductDetailPage";
import CartPage, { addToCart } from "./CartPage";
import OrdersPage from "./OrdersPage";

const PAYPAL_CLIENT_ID =
  "AdE3Rfow5IlmAtfn361m5LsJGr01L4KZo7V6cxJovroYWxwXHIZsh5Ja_01uHMV19DEExovLW8YXsdZN";

// TEMP: full file restore in progress - if you see this the restore failed partially
export default function Broken() { return null; }
