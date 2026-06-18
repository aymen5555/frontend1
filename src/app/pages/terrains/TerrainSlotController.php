<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Terrain;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class TerrainSlotController extends Controller
{
    /**
     * Returns a list of hourly slots for a terrain on a specific date.
     * Route: GET /api/terrains/{id}/slots?date=YYYY-MM-DD
     */
    public function __invoke(Request $request, $id)
    {
        $terrain = Terrain::findOrFail($id);
        $date = $request->query('date', Carbon::today()->toDateString());
        
        // Opening/Closing hours (ideally stored in DB, defaulting here to 08:00-22:00)
        $opening = $terrain->opening_time ?? '08:00';
        $closing = $terrain->closing_time ?? '22:00';

        $startOfDay = Carbon::parse("$date $opening");
        $endOfDay = Carbon::parse("$date $closing");

        // Fetch reservations that are not cancelled
        $reservations = Reservation::where('terrain_id', $id)
            ->whereDate('start_at', $date)
            ->where('status', '!=', 'cancelled')
            ->get(['start_at', 'end_at']);

        $slots = [];
        $now = Carbon::now();

        for ($current = $startOfDay->copy(); $current->lt($endOfDay); $current->addHour()) {
            $slotStart = $current->copy();
            $slotEnd = $current->copy()->addHour();
            
            $isPast = $slotStart->lt($now);
            $isReserved = $reservations->contains(function ($res) use ($slotStart, $slotEnd) {
                return $slotStart->lt($res->end_at) && $slotEnd->gt($res->start_at);
            });

            $slots[] = [
                'time' => $slotStart->format('H:i'),
                'available' => !$isPast && !$isReserved,
            ];
        }

        return response()->json($slots);
    }
}