/*
  # Seed Verification Points with Geospatial Clustering

  1. Test Data
    - Adds sample agent verifications with GPS coordinates
    - Creates clustered points in Kampala (Uganda) and Johannesburg (South Africa)
    - Includes same-site, same-premises, and different-area clusters
    - Adds outlier points for testing detection logic

  2. Clustering Examples
    - Agent 1: Tight cluster in Kampala (same site, ~30m radius)
    - Agent 2: Two clusters in Johannesburg (same premises + different area)
    - Agent 3: Wide spread with outliers

  3. Notes
    - Coordinates are realistic locations in actual cities
    - Timestamps spread over 30 days for movement analysis
    - All points have valid GPS coordinates for reverse geocoding
*/

DO $$
DECLARE
  agent1_id uuid;
  agent2_id uuid;
  agent3_id uuid;
BEGIN
  SELECT id INTO agent1_id FROM agents WHERE email LIKE 'agent1%' LIMIT 1;
  SELECT id INTO agent2_id FROM agents WHERE email LIKE 'agent2%' LIMIT 1;
  SELECT id INTO agent3_id FROM agents WHERE email LIKE 'agent3%' LIMIT 1;

  IF agent1_id IS NOT NULL THEN
    INSERT INTO agent_verifications (agent_id, gps_lat, gps_lng, verified_at, notes) VALUES
    (agent1_id, 0.3476, 32.5825, NOW() - INTERVAL '1 day', 'Main operating location - Kampala Central'),
    (agent1_id, 0.3478, 32.5827, NOW() - INTERVAL '3 days', 'Same site verification'),
    (agent1_id, 0.3475, 32.5823, NOW() - INTERVAL '5 days', 'Consistent location'),
    (agent1_id, 0.3477, 32.5826, NOW() - INTERVAL '7 days', 'Within 50m radius'),
    (agent1_id, 0.3474, 32.5824, NOW() - INTERVAL '10 days', 'Same premises cluster'),
    (agent1_id, 0.3479, 32.5828, NOW() - INTERVAL '12 days', 'Tight cluster verification')
    ON CONFLICT DO NOTHING;
  END IF;

  IF agent2_id IS NOT NULL THEN
    INSERT INTO agent_verifications (agent_id, gps_lat, gps_lng, verified_at, notes) VALUES
    (agent2_id, -26.2041, 28.0473, NOW() - INTERVAL '1 day', 'Johannesburg CBD - Primary location'),
    (agent2_id, -26.2045, 28.0478, NOW() - INTERVAL '2 days', 'Same block'),
    (agent2_id, -26.2038, 28.0470, NOW() - INTERVAL '4 days', 'Within premises'),
    (agent2_id, -26.1076, 28.0536, NOW() - INTERVAL '8 days', 'Sandton office - Secondary cluster'),
    (agent2_id, -26.1080, 28.0540, NOW() - INTERVAL '10 days', 'Sandton area'),
    (agent2_id, -26.2042, 28.0475, NOW() - INTERVAL '15 days', 'Back to CBD'),
    (agent2_id, -26.2048, 28.0480, NOW() - INTERVAL '20 days', 'CBD verification'),
    (agent2_id, -26.1078, 28.0538, NOW() - INTERVAL '25 days', 'Sandton again')
    ON CONFLICT DO NOTHING;
  END IF;

  IF agent3_id IS NOT NULL THEN
    INSERT INTO agent_verifications (agent_id, gps_lat, gps_lng, verified_at, notes) VALUES
    (agent3_id, 0.3476, 32.5825, NOW() - INTERVAL '1 day', 'Kampala base'),
    (agent3_id, 0.3480, 32.5830, NOW() - INTERVAL '3 days', 'Nearby location'),
    (agent3_id, 0.4244, 33.2041, NOW() - INTERVAL '7 days', 'Jinja visit - Outlier >60km'),
    (agent3_id, 0.3478, 32.5827, NOW() - INTERVAL '10 days', 'Back to Kampala'),
    (agent3_id, 0.0559, 32.4635, NOW() - INTERVAL '15 days', 'Entebbe trip - Outlier ~35km'),
    (agent3_id, 0.3475, 32.5823, NOW() - INTERVAL '20 days', 'Kampala primary'),
    (agent3_id, 0.3490, 32.5850, NOW() - INTERVAL '25 days', 'Extended area ~1.5km')
    ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE 'Seeded verification points with geospatial clustering test data';
END $$;
