import { StyleSheet, Text, View } from 'react-native';
import { DashboardGrid } from '../../components/DashboardGrid';

const { act, create } = jest.requireActual('react-test-renderer');

it('places two small modules in one equal-width row', async () => {
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      <DashboardGrid
        items={[
          { id: 'a', size: 'small', content: <Text>A</Text> },
          { id: 'b', size: 'small', content: <Text>B</Text> },
        ]}
      />,
    );
  });
  const rows = view.root
    .findAllByType(View)
    .filter(
      (node: { props: { testID?: string } }) =>
        node.props.testID === 'dashboard-grid-row',
    );
  expect(rows).toHaveLength(1);
  expect(
    rows[0]
      .findAllByType(View)
      .filter(
        (node: { props: { testID?: string } }) =>
          node.props.testID === 'dashboard-widget',
      ),
  ).toHaveLength(2);
  expect(StyleSheet.flatten(rows[0].props.style).flexDirection).toBe('row');
  expect(StyleSheet.flatten(rows[0].props.style).height).toBeUndefined();
  await act(async () => view.unmount());
});

it('keeps an odd small module half-width and a medium module full-width', async () => {
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      <DashboardGrid
        items={[
          { id: 'a', size: 'small', content: <Text>A</Text> },
          { id: 'b', size: 'medium', content: <Text>B</Text> },
        ]}
      />,
    );
  });
  const rows = view.root
    .findAllByType(View)
    .filter(
      (node: { props: { testID?: string } }) =>
        node.props.testID === 'dashboard-grid-row',
    );
  expect(rows).toHaveLength(2);
  expect(rows[0].findAllByType(View)).toHaveLength(3);
  expect(StyleSheet.flatten(rows[0].props.style).height).toBeUndefined();
  expect(
    rows[1]
      .findAllByType(View)
      .filter(
        (node: { props: { testID?: string } }) =>
          node.props.testID === 'dashboard-widget',
      ),
  ).toHaveLength(1);
  expect(StyleSheet.flatten(rows[1].props.style).height).toBeUndefined();
  await act(async () => view.unmount());
});
